import {Generators, int, MakeMutable, Notifier, Observer, Option, Selection, Terminable} from "@dlm-daw/lib-std"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {Editing} from "@dlm-daw/lib-box"
import {Line, NoteModifyStrategy} from "./NoteModifyStrategies"
import {EventCollection, ppqn} from "@dlm-daw/lib-dsp"
import {NoteModifier} from "@/ui/timeline/editors/notes/NoteModifier.ts"
import {NoteEventBoxAdapter} from "@dlm-daw/studio-adapters"
import {NoteEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader.ts"
import {UINoteEvent} from "@/ui/timeline/editors/notes/UINoteEvent.ts"
import {Dragging} from "@dlm-daw/lib-dom"

type Construct = Readonly<{
    element: Element
    snapping: Snapping
    selection: Selection<NoteEventBoxAdapter>
    pointerPulse: ppqn
    pointerPitch: int
    reference: NoteEventOwnerReader
}>

export class NoteCreateModifier implements NoteModifier {
    static create(construct: Construct): NoteCreateModifier {
        return new NoteCreateModifier(construct)
    }

    readonly #element: Element
    readonly #snapping: Snapping
    readonly #selection: Selection<NoteEventBoxAdapter>
    readonly #pointerPulse: ppqn
    readonly #reference: NoteEventOwnerReader

    readonly #notifier: Notifier<void>
    readonly #creation: MakeMutable<UINoteEvent>

    #deltaLoopDuration: ppqn = 0.0

    private constructor({element, snapping, selection, pointerPulse, pointerPitch, reference}: Construct) {
        this.#element = element
        this.#snapping = snapping
        this.#selection = selection
        this.#pointerPulse = pointerPulse
        this.#reference = reference

        this.#notifier = new Notifier<void>()

        const position = this.#snapping.floor(pointerPulse)
        this.#creation = {
            type: "note-event",
            position,
            pitch: pointerPitch,
            duration: snapping.value,
            complete: position + snapping.value,
            cent: 0.0,
            chance: 100,
            playCount: 1,
            playCurve: 0.0,
            velocity: 1.0,
            isSelected: true
        }
    }

    subscribeUpdate(observer: Observer<void>): Terminable {return this.#notifier.subscribe(observer)}

    showOrigin(): boolean {return false}
    showCreation(): Option<UINoteEvent> {return Option.wrap(this.#creation)}
    showPropertyLine(): Option<Line> {return Option.None}
    readContentDuration(region: NoteEventOwnerReader): number {return region.contentDuration}
    selectedModifyStrategy(): NoteModifyStrategy {
        return {
            ...NoteModifyStrategy.Identity,
            iterateRange: <E extends UINoteEvent>(events: EventCollection<E>, from: number, to: number): Iterable<E> => {
                return Generators.flatten(events.iterateRange(from, to), [this.#creation as E])
            }
        }
    }
    unselectedModifyStrategy(): NoteModifyStrategy {return NoteModifyStrategy.Identity}

    update({clientX}: Dragging.Event): void {
        const clientRect = this.#element.getBoundingClientRect()
        const minDuration = this.#snapping.value
        const deltaLoopDuration: int = this.#snapping
            .computeDelta(this.#pointerPulse, clientX - clientRect.left, minDuration)
        if (this.#deltaLoopDuration !== deltaLoopDuration) {
            this.#deltaLoopDuration = deltaLoopDuration
            this.#creation.duration = Math.max(minDuration + this.#deltaLoopDuration - this.#reference.offset, minDuration)
            this.#notifier.notify()
        }
    }

    approve(editing: Editing): void {
        editing.modify(() => {
            this.#selection.deselectAll()
            this.#selection.select(this.#reference.content.createEvent(this.#creation))
        })
    }

    cancel(): void {
        this.#deltaLoopDuration = 0
        this.#notifier.notify()
    }
}