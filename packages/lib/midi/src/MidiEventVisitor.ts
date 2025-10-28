import {byte, unitValue} from "@dlm-daw/lib-std"

export interface MidiEventVisitor {
    noteOn?(note: byte, velocity: byte): void
    noteOff?(note: byte): void
    pitchBend?(delta: number): void
    controller?(id: byte, value: unitValue): void
}