import {RootBox} from "@dlm-daw/studio-boxes"
import {Address} from "@dlm-daw/lib-box"
import {UUID} from "@dlm-daw/lib-std"
import {AudioBusBoxAdapter} from "./audio-unit/AudioBusBoxAdapter"
import {Pointers} from "@dlm-daw/studio-enums"
import {IndexedBoxAdapterCollection} from "./IndexedBoxAdapterCollection"
import {AudioUnitBoxAdapter} from "./audio-unit/AudioUnitBoxAdapter"
import {AnyClipBoxAdapter} from "./UnionAdapterTypes"
import {BoxAdapterCollection} from "./BoxAdapterCollection"
import {BoxAdaptersContext} from "./BoxAdaptersContext"
import {BoxAdapter} from "./BoxAdapter"
import {TimelineBoxAdapter} from "./timeline/TimelineBoxAdapter"
import {GrooveShuffleBoxAdapter} from "./grooves/GrooveShuffleBoxAdapter"
import {PianoModeAdapter} from "./PianoModeAdapter"

export class RootBoxAdapter implements BoxAdapter {
    readonly #context: BoxAdaptersContext
    readonly #box: RootBox

    readonly #audioUnits: IndexedBoxAdapterCollection<AudioUnitBoxAdapter, Pointers.AudioUnits>
    readonly #audioBusses: BoxAdapterCollection<AudioBusBoxAdapter>
    readonly #pianoMode: PianoModeAdapter

    constructor(context: BoxAdaptersContext, box: RootBox) {
        this.#context = context
        this.#box = box

        this.#audioUnits = IndexedBoxAdapterCollection.create(this.#box.audioUnits,
            box => this.#context.boxAdapters.adapterFor(box, AudioUnitBoxAdapter), Pointers.AudioUnits)

        this.#audioBusses = new BoxAdapterCollection<AudioBusBoxAdapter>(this.#box.audioBusses.pointerHub, box =>
            this.#context.boxAdapters.adapterFor(box, AudioBusBoxAdapter), Pointers.AudioBusses)

        this.#pianoMode = new PianoModeAdapter(this.#box.pianoMode)
    }

    get uuid(): UUID.Bytes {return this.#box.address.uuid}
    get address(): Address {return this.#box.address}
    get box(): RootBox {return this.#box}
    get audioBusses(): BoxAdapterCollection<AudioBusBoxAdapter> {return this.#audioBusses}
    get audioUnits(): IndexedBoxAdapterCollection<AudioUnitBoxAdapter, Pointers.AudioUnits> {return this.#audioUnits}
    get clips(): ReadonlyArray<AnyClipBoxAdapter> {
        return this.#audioUnits.adapters()
            .flatMap(adapter => adapter.tracks.collection.adapters())
            .flatMap(track => track.clips.collection.adapters())
    }
    get groove(): GrooveShuffleBoxAdapter {
        return this.#context.boxAdapters
            .adapterFor(this.#box.groove.targetVertex.unwrap("no groove").box, GrooveShuffleBoxAdapter)
    }
    get timeline(): TimelineBoxAdapter {
        return this.#context.boxAdapters
            .adapterFor(this.#box.timeline.targetVertex.unwrap("no timeline").box, TimelineBoxAdapter)
    }
    get pianoMode(): PianoModeAdapter {return this.#pianoMode}
    get created(): Date {return new Date(this.#box.created.getValue())}

    terminate(): void {this.#audioUnits.terminate()}
}