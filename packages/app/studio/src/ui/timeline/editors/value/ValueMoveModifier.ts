import {
    Arrays,
    asDefined,
    assert,
    clamp,
    int,
    Notifier,
    Nullable,
    NumberComparator,
    Observer,
    Option,
    Selection,
    Terminable,
    unitValue,
    ValueAxis
} from "@dlm-daw/lib-std"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {Editing} from "@dlm-daw/lib-box"
import {
    AutomatableParameterFieldAdapter,
    ValueEventBoxAdapter,
    ValueEventCollectionBoxAdapter
} from "@dlm-daw/studio-adapters"
import {EventCollection, Interpolation, ppqn, ValueEvent} from "@dlm-daw/lib-dsp"
import {ValueModifier} from "./ValueModifier"
import {ValueEventDraft} from "./ValueEventDraft.ts"
import {ValueEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader.ts"
import {Dragging} from "@dlm-daw/lib-dom"
import {UIValueEvent} from "@/ui/timeline/editors/value/UIValueEvent.ts"

type Construct = Readonly<{
    element: Element
    parameter: AutomatableParameterFieldAdapter
    selection: Selection<ValueEventBoxAdapter>
    valueAxis: ValueAxis
    snapping: Snapping
    pointerPulse: ppqn
    pointerValue: unitValue
    reference: ValueEventBoxAdapter
    collection: ValueEventCollectionBoxAdapter
}>

type SnapGuide = {
    value: unitValue
    index: int
    position: number
}

export const SnapValueThresholdInPixels = 8

export class ValueMoveModifier implements ValueModifier {
    static create(construct: Construct): ValueMoveModifier {return new ValueMoveModifier(construct)}

    readonly #element: Element
    readonly #parameter: AutomatableParameterFieldAdapter
    readonly #selection: Selection<ValueEventBoxAdapter>
    readonly #valueAxis: ValueAxis
    readonly #snapping: Snapping
    readonly #pointerPulse: ppqn
    readonly #pointerValue: unitValue
    readonly #reference: ValueEventBoxAdapter
    readonly #collection: ValueEventCollectionBoxAdapter

    readonly #notifier: Notifier<void>
    readonly #masks: ReadonlyArray<[ppqn, ppqn]>
    readonly #snapValues: ReadonlyArray<unitValue>

    #copy: boolean
    #freezeMode: boolean
    #deltaValue: number
    #deltaPosition: ppqn
    #snapValue: Option<unitValue>

    private constructor({
                            element, parameter, selection, valueAxis, snapping,
                            pointerPulse, pointerValue, reference, collection
                        }: Construct) {
        this.#element = element
        this.#parameter = parameter
        this.#selection = selection
        this.#valueAxis = valueAxis
        this.#snapping = snapping
        this.#pointerPulse = pointerPulse
        this.#pointerValue = pointerValue
        this.#reference = reference
        this.#collection = collection

        this.#notifier = new Notifier<void>()
        this.#masks = this.#buildMasks()
        this.#snapValues = this.#buildSnapValues()

        this.#copy = false
        this.#freezeMode = false
        this.#deltaValue = 0.0
        this.#deltaPosition = 0
        this.#snapValue = Option.None
    }

    subscribeUpdate(observer: Observer<void>): Terminable {return this.#notifier.subscribe(observer)}

    showOrigin(): boolean {return this.#copy}
    snapValue(): Option<unitValue> {return this.#snapValue}
    translateSearch(value: ppqn): ppqn {return value - this.#deltaPosition}
    isVisible(event: ValueEvent): boolean {
        const deltaPosition = this.#deltaPosition
        const position = event.position - deltaPosition
        for (const [min, max] of this.#masks) {
            if ((min < position || (deltaPosition > 0 && min === position))
                && (position < max || (deltaPosition < 0 && max === position))) {
                return false
            }
        }
        return true
    }
    readPosition(adapter: ValueEvent): ppqn {return adapter.position + this.#deltaPosition}
    readValue(event: ValueEvent): unitValue {return clamp(event.value + this.#deltaValue, 0.0, 1.0)}
    readInterpolation(event: UIValueEvent): Interpolation {return event.interpolation}
    iterator(searchMin: ppqn, searchMax: ppqn): Generator<ValueEventDraft> {
        return new ValueEventDraft.Solver(this.#eventCollection(), this,
            searchMin - Math.max(0, this.#deltaPosition), searchMax).iterate()
    }
    readContentDuration(owner: ValueEventOwnerReader): number {return owner.contentDuration}
    update(event: Dragging.Event): void {
        const {clientX, clientY, altKey, ctrlKey: freezeMode, shiftKey} = event
        const clientRect = this.#element.getBoundingClientRect()
        const localX = clientX - clientRect.left
        const localY = clientY - clientRect.top
        const valueMapping = this.#parameter.valueMapping
        const pointerValue = valueMapping.x(valueMapping.y(this.#valueAxis.axisToValue(localY)))
        const closest: Nullable<SnapGuide> = shiftKey ? null : this.#snapValues
            .map<SnapGuide>((value: unitValue, index: int) =>
                ({value, index, position: this.#valueAxis.valueToAxis(value)}))
            .reduce((closest: Nullable<SnapGuide>, guide: SnapGuide) =>
                Math.abs(guide.position - localY) <= (
                    closest === null
                        ? SnapValueThresholdInPixels
                        : Math.abs(closest.position - localY))
                    ? guide : closest, null)
        const snapValue = closest === null ? Option.None : Option.wrap(closest.value)
        const deltaValue: number = freezeMode
            ? 0.0
            : snapValue.match({
                none: () => pointerValue - this.#pointerValue,
                some: value => value - this.#reference.value
            })
        const deltaPosition: int = this.#snapping.computeDelta(this.#pointerPulse, localX, this.#reference.position)
        let change = false
        if (this.#deltaPosition !== deltaPosition) {
            this.#deltaPosition = deltaPosition
            change = true
        }
        if (this.#deltaValue !== deltaValue) {
            this.#deltaValue = deltaValue
            change = true
        }
        if (this.#copy !== altKey) {
            this.#copy = altKey
            change = true
        }
        if (this.#snapValue !== snapValue) {
            this.#snapValue = snapValue
            change = true
        }
        if (this.#freezeMode !== freezeMode) {
            this.#freezeMode = freezeMode
            change = true
        }
        if (change) {this.#dispatchChange()}
    }

    approve(editing: Editing): void {
        if (this.#deltaValue === 0 && this.#deltaPosition === 0) {
            if (this.#copy) {this.#dispatchChange()} // reset visuals
            return
        }
        // take 'em all
        const collection = this.#eventCollection()
        const solver = new ValueEventDraft.Solver(collection, this, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
        const stream: Array<ValueEventDraft> = []
        for (const event of solver.iterate()) {stream.push(event) }
        // iterator
        const pull = (() => {
            const iterator = collection.asArray().slice().values()
            return (): Nullable<ValueEventBoxAdapter> => {
                const {done, value} = iterator.next()
                return done ? null : value
            }
        })()
        // update events
        const iterable = stream.values()
        const {done, value} = iterable.next()
        assert(!done, "Internal Error")
        const obsolete: Array<ValueEventDraft> = []
        let index: int = 0
        let prev: ValueEventDraft = asDefined(value)
        for (const next of iterable) {
            if (prev.position === next.position) {
                if (++index > 1) {obsolete.push(prev)}
                next.index = 1
            } else {
                index = 0
                next.index = 0
            }
            prev = next
        }
        obsolete.forEach(event => Arrays.remove(stream, event))

        editing.modify(() => {
            stream.forEach(event => {
                const stock = pull()
                const adapter: ValueEventBoxAdapter = stock === null
                    ? this.#collection.createEvent(event)
                    : stock.copyFrom(event)
                if (event.isSelected && !adapter.isSelected) {
                    this.#selection.select(adapter)
                } else if (!event.isSelected && adapter.isSelected) {
                    this.#selection.deselect(adapter)
                }
            })
            while (true) {
                const obsolete = pull()
                if (obsolete === null) {break}
                obsolete.box.delete()
            }
        })
        this.#dispatchChange()
    }

    cancel(): void {
        this.#copy = false
        this.#snapValue = Option.None
        this.#freezeMode = false
        this.#deltaValue = 0
        this.#deltaPosition = 0
        this.#dispatchChange()
    }

    #dispatchChange(): void {this.#notifier.notify()}

    #buildMasks(): ReadonlyArray<[ppqn, ppqn]> {
        const masks: Array<[ppqn, ppqn]> = []
        let min: int = Number.MIN_SAFE_INTEGER
        let max: int = Number.MAX_SAFE_INTEGER
        let started: boolean = false
        let ended: boolean = false
        for (const adapter of this.#eventCollection().asArray()) {
            if (adapter.isSelected) {
                if (started) {
                    max = adapter.position
                    ended = max > min
                } else {
                    min = adapter.position
                    started = true
                }
            } else if (ended) {
                masks.push([min, max])
                min = Number.MIN_SAFE_INTEGER
                max = Number.MAX_SAFE_INTEGER
                started = false
                ended = false
            } else {
                started = false
                ended = false
            }
        }
        if (ended) {masks.push([min, max])}
        return masks
    }

    #buildSnapValues(): ReadonlyArray<unitValue> {
        const result = new Set<unitValue>([this.#parameter.getUnitValue()])
        this.#eventCollection().asArray().forEach(event => result.add(event.value))
        return Array.from(result).sort(NumberComparator)
    }

    #eventCollection(): EventCollection<ValueEventBoxAdapter> {return this.#collection.events}
}