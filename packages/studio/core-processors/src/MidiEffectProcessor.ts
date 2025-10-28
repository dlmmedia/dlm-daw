import {Processor} from "./processing"
import {NoteEventSource, NoteEventTarget} from "./NoteEventSource"
import {int, Terminable, UUID} from "@dlm-daw/lib-std"
import {MidiEffectDeviceAdapter} from "@dlm-daw/studio-adapters"

export interface MidiEffectProcessor extends Processor, NoteEventSource, NoteEventTarget, Terminable {
    get uuid(): UUID.Bytes

    index(): int
    adapter(): MidiEffectDeviceAdapter
}