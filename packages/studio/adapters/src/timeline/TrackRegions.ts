import {RegionCollection} from "@dlm-daw/lib-dsp"
import {assert, Notifier, Observer, SortedSet, Subscription, Terminator, UUID} from "@dlm-daw/lib-std"
import {Pointers} from "@dlm-daw/studio-enums"
import {TrackBoxAdapter} from "./TrackBoxAdapter"
import {AnyRegionBoxAdapter} from "../UnionAdapterTypes"
import {BoxAdapters} from "../BoxAdapters"
import {RegionAdapters, RegionComparator} from "./RegionBoxAdapter"

export class TrackRegions {
    readonly #trackBoxAdapter: TrackBoxAdapter

    readonly #terminator: Terminator
    readonly #changeNotifier: Notifier<void>
    readonly #collection: RegionCollection<AnyRegionBoxAdapter>
    readonly #adapters: SortedSet<UUID.Bytes, AnyRegionBoxAdapter>

    constructor(adapter: TrackBoxAdapter, boxAdapters: BoxAdapters) {
        this.#trackBoxAdapter = adapter

        this.#terminator = new Terminator()
        this.#changeNotifier = this.#terminator.own(new Notifier<void>())
        this.#collection = RegionCollection.create<AnyRegionBoxAdapter>(RegionComparator)
        this.#adapters = UUID.newSet<AnyRegionBoxAdapter>(adapter => adapter.uuid)
        this.#terminator.ownAll(
            this.#trackBoxAdapter.box.regions.pointerHub.catchupAndSubscribeTransactual({
                onAdd: ({box}) => {
                    const adapter = RegionAdapters.for(boxAdapters, box)
                    const added = this.#adapters.add(adapter)
                    assert(added, `Cannot add ${box}`)
                    this.#collection.add(adapter)
                    this.dispatchChange()
                },
                onRemove: ({box: {address: {uuid}}}) => {
                    this.#collection.remove(this.#adapters.removeByKey(uuid))
                    this.dispatchChange()
                }
            }, Pointers.RegionCollection)
        )
    }

    get trackBoxAdapter(): TrackBoxAdapter {return this.#trackBoxAdapter}
    get collection(): RegionCollection<AnyRegionBoxAdapter> {return this.#collection}
    get adapters(): SortedSet<Readonly<Uint8Array>, AnyRegionBoxAdapter> {return this.#adapters}

    onIndexingChanged(): void {
        this.#collection.onIndexingChanged()
        this.dispatchChange()
    }

    subscribeChanges(observer: Observer<void>): Subscription {return this.#changeNotifier.subscribe(observer)}
    dispatchChange(): void {this.#changeNotifier.notify()}
    terminate() {this.#terminator.terminate()}
}