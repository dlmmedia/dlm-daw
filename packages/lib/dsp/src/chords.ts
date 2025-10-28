import {Arrays, int} from "@dlm-daw/lib-std"

export namespace Chord {
    export const Major: ReadonlyArray<int> = [0, 2, 4, 5, 7, 9, 11]
    export const Minor: ReadonlyArray<int> = [0, 2, 3, 5, 7, 8, 10]
    export const NoteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    export const compile = (scale: ReadonlyArray<int>, root: int, variation: int, n: int): ReadonlyArray<int> =>
        Arrays.create(index => {
            const step = variation + index * 2
            const interval = scale[step % 7] + Math.floor(step / 7) * 12
            return root + interval
        }, n)

    export const toString = (midiNote: int): string => NoteLabels[midiNote % 12] + (Math.floor(midiNote / 12) - 2)
}