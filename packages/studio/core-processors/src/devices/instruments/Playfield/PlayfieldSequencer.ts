import {Terminable} from "@dlm-daw/lib-std"
import {Event} from "@dlm-daw/lib-dsp"
import {Block} from "../../../processing"
import {EngineContext} from "../../../EngineContext"
import {EventProcessor} from "../../../EventProcessor"
import {NoteEventSource, NoteEventTarget, NoteLifecycleEvent} from "../../../NoteEventSource"
import {NoteEventInstrument} from "../../../NoteEventInstrument"
import {PlayfieldDeviceProcessor} from "../PlayfieldDeviceProcessor"

export class PlayfieldSequencer extends EventProcessor implements NoteEventTarget {
    readonly #device: PlayfieldDeviceProcessor

    readonly #noteEventInstrument: NoteEventInstrument

    constructor(context: EngineContext, device: PlayfieldDeviceProcessor) {
        super(context)

        this.#device = device

        this.#noteEventInstrument = new NoteEventInstrument(this, context.broadcaster, device.adapter.audioUnitBoxAdapter().address)

        this.own(context.registerProcessor(this))
        this.readAllParameters()
    }

    introduceBlock(block: Block): void {this.#noteEventInstrument.introduceBlock(block)}
    setNoteEventSource(source: NoteEventSource): Terminable {return this.#noteEventInstrument.setNoteEventSource(source)}

    reset(): void {
        this.eventInput.clear()
        this.#noteEventInstrument.clear()
    }

    processEvents(_block: Readonly<Block>, _from: number, _to: number): void {}

    handleEvent({index}: Readonly<Block>, event: Event): void {
        if (NoteLifecycleEvent.isStart(event)) {
            this.#device.optSampleProcessor(event.pitch).ifSome(({eventInput}) => eventInput.add(index, event))
        } else if (NoteLifecycleEvent.isStop(event)) {
            this.#device.optSampleProcessor(event.pitch).ifSome(({eventInput}) => eventInput.add(index, event))
        }
    }

    toString(): string {return "{PlayfieldSequencer}"}
}