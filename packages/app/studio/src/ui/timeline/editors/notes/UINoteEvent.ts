import {NoteEvent, ppqn} from "@dlm-daw/lib-dsp"
import {int} from "@dlm-daw/lib-std"

export type UINoteEvent = NoteEvent & {
    isSelected: boolean
    complete: ppqn
    chance: number
    playCount: int
    playCurve: number
}