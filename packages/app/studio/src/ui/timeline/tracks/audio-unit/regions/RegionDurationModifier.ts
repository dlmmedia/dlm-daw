import {RegionModifier} from "@/ui/timeline/tracks/audio-unit/regions/RegionModifier.ts"
import {Editing} from "@dlm-daw/lib-box"
import {Arrays, int, isNotNull, Option} from "@dlm-daw/lib-std"
import {ppqn, RegionCollection} from "@dlm-daw/lib-dsp"
import {
    AnyLoopableRegionBoxAdapter,
    AnyRegionBoxAdapter,
    TrackBoxAdapter,
    UnionAdapterTypes
} from "@dlm-daw/studio-adapters"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {RegionClipResolver} from "@/ui/timeline/tracks/audio-unit/regions/RegionClipResolver.ts"
import {RegionModifyStrategy} from "@/ui/timeline/tracks/audio-unit/regions/RegionModifyStrategies.ts"
import {Dragging} from "@dlm-daw/lib-dom"

class SelectedModifyStrategy implements RegionModifyStrategy {
    readonly #tool: RegionDurationModifier

    constructor(tool: RegionDurationModifier) {this.#tool = tool}

    readPosition(region: AnyRegionBoxAdapter): ppqn {return region.position}
    readDuration(region: AnyRegionBoxAdapter): ppqn {return this.readComplete(region) - this.readPosition(region)}
    readComplete(region: AnyRegionBoxAdapter): ppqn {
        const duration = this.#tool.aligned
            ? (this.#tool.bounds[1] + this.#tool.deltaDuration) - region.position
            : region.duration + this.#tool.deltaDuration
        const complete = region.position + Math.max(Math.min(this.#tool.snapping.value, region.duration), duration)
        return region.trackBoxAdapter.map(trackAdapter => trackAdapter.regions.collection
            .greaterEqual(region.complete, region => region.isSelected)).match({
            none: () => complete,
            some: region => complete > region.position ? region.position : complete
        })
    }
    readLoopOffset(region: AnyLoopableRegionBoxAdapter): ppqn {return region.loopOffset}
    readLoopDuration(region: AnyLoopableRegionBoxAdapter): ppqn {return region.loopDuration}
    readMirror(region: AnyRegionBoxAdapter): boolean {return region.isMirrowed}
    translateTrackIndex(value: int): int {return value}
    iterateRange<R extends AnyRegionBoxAdapter>(regions: RegionCollection<R>, from: ppqn, to: ppqn): Iterable<R> {
        return regions.iterateRange(
            this.#tool.adapters.reduce((from, adapter) => Math.min(from, adapter.position), from), to)
    }
}

type Construct = Readonly<{
    element: Element
    snapping: Snapping
    pointerPulse: ppqn
    bounds: [ppqn, ppqn]
}>

export class RegionDurationModifier implements RegionModifier {
    static create(selected: ReadonlyArray<AnyRegionBoxAdapter>, construct: Construct): Option<RegionDurationModifier> {
        const adapters = selected.filter(region => UnionAdapterTypes.isLoopableRegion(region))
        return adapters.length === 0 ? Option.None : Option.wrap(new RegionDurationModifier(construct, adapters))
    }

    readonly #element: Element
    readonly #snapping: Snapping
    readonly #pointerPulse: ppqn
    readonly #bounds: [ppqn, ppqn]
    readonly #adapters: ReadonlyArray<AnyLoopableRegionBoxAdapter>
    readonly #selectedModifyStrategy: SelectedModifyStrategy

    #aligned: boolean
    #deltaDuration: int

    private constructor({element, snapping, pointerPulse, bounds}: Construct,
                        adapter: ReadonlyArray<AnyLoopableRegionBoxAdapter>) {
        this.#element = element
        this.#snapping = snapping
        this.#pointerPulse = pointerPulse
        this.#bounds = bounds
        this.#adapters = adapter
        this.#selectedModifyStrategy = new SelectedModifyStrategy(this)

        this.#aligned = false
        this.#deltaDuration = 0
    }

    get snapping(): Snapping {return this.#snapping}
    get adapters(): ReadonlyArray<AnyLoopableRegionBoxAdapter> {return this.#adapters}
    get aligned(): boolean {return this.#aligned}
    get deltaDuration(): int {return this.#deltaDuration}
    get bounds(): [ppqn, ppqn] {return this.#bounds}

    showOrigin(): boolean {return false}
    selectedModifyStrategy(): RegionModifyStrategy {return this.#selectedModifyStrategy}
    unselectedModifyStrategy(): RegionModifyStrategy {return RegionModifyStrategy.Identity}

    update({clientX, ctrlKey}: Dragging.Event): void {
        const aligned = ctrlKey
        const originalDuration = this.#bounds[1] - this.#bounds[0]
        const deltaDuration = this.#snapping.computeDelta(
            this.#pointerPulse, clientX - this.#element.getBoundingClientRect().left, originalDuration)
        let change = false
        if (this.#aligned !== aligned) {
            this.#aligned = aligned
            change = true
        }
        if (this.#deltaDuration !== deltaDuration) {
            this.#deltaDuration = deltaDuration
            change = true
        }
        if (change) {this.#dispatchChange()}
    }

    approve(editing: Editing): void {
        const modifiedTracks: ReadonlyArray<TrackBoxAdapter> =
            Arrays.removeDuplicates(this.#adapters
                .map(adapter => adapter.trackBoxAdapter.unwrapOrNull())
                .filter(isNotNull))
        const solver = RegionClipResolver
            .fromSelection(modifiedTracks, this.#adapters.filter(({box}) => box.isAttached()), this, 0)
        const result = this.#adapters.map<{ region: AnyLoopableRegionBoxAdapter, duration: ppqn }>(region =>
            ({region, duration: this.#selectedModifyStrategy.readDuration(region)}))
        editing.modify(() => {
            result.forEach(({region, duration}) => region.box.duration.setValue(duration))
            solver()
        })
        RegionClipResolver.validateTracks(modifiedTracks)
    }

    cancel(): void {
        this.#aligned = false
        this.#deltaDuration = 0
        this.#dispatchChange()
    }

    #dispatchChange(): void {
        this.#adapters.forEach(adapter => adapter.trackBoxAdapter
            .ifSome(trackAdapter => trackAdapter.regions.dispatchChange()))
    }
}