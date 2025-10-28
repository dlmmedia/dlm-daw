import {int} from "@dlm-daw/lib-std"

export interface Event<TYPE> {
    readonly ticks: int
    readonly type: TYPE
}