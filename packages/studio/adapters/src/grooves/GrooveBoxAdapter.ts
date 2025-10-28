import {AssertType} from "@dlm-daw/lib-std"
import {Groove} from "@dlm-daw/lib-dsp"
import {BoxAdapter} from "../BoxAdapter"

export interface GrooveAdapter extends BoxAdapter, Groove {
    type: "groove-adapter"
}

export namespace GrooveAdapter {
    export const checkType: AssertType<GrooveAdapter> = (adapter: unknown): adapter is GrooveAdapter =>
        adapter !== null && typeof adapter === "object" && "type" in adapter && adapter.type === "groove-adapter"
}