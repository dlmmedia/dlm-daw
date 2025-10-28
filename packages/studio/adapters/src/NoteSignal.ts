import {byte, panic, unitValue, UUID} from "@dlm-daw/lib-std"
import {MidiData} from "@dlm-daw/lib-midi"

export type NoteSignalOn = { type: "note-on", uuid: UUID.Bytes, pitch: byte, velocity: unitValue }

export type NoteSignalOff = { type: "note-off", uuid: UUID.Bytes, pitch: byte }

export type NoteSignal = NoteSignalOn | NoteSignalOff

export namespace NoteSignal {
    export const on = (uuid: UUID.Bytes, pitch: byte, velocity: unitValue): NoteSignalOn =>
        ({type: "note-on", uuid, pitch, velocity})
    export const off = (uuid: UUID.Bytes, pitch: byte): NoteSignalOff =>
        ({type: "note-off", uuid, pitch})

    export const isOn = (signal: NoteSignal): signal is NoteSignalOn => signal.type === "note-on"
    export const isOff = (signal: NoteSignal): signal is NoteSignalOff => signal.type === "note-off"

    export const fromEvent = (event: MIDIMessageEvent, uuid: UUID.Bytes): NoteSignal => {
        const data = event.data!
        if (MidiData.isNoteOn(data)) {
            const pitch = MidiData.readPitch(data)
            const velocity = MidiData.readVelocity(data)
            return ({type: "note-on", uuid, pitch, velocity})
        } else if (MidiData.isNoteOff(data)) {
            const pitch = MidiData.readPitch(data)
            return ({type: "note-off", uuid, pitch})
        }
        return panic("Unknown MIDI event")
    }
}