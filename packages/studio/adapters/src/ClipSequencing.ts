import {Option, Terminable, UUID} from "@dlm-daw/lib-std"
import {ppqn} from "@dlm-daw/lib-dsp"
import {AnyClipBoxAdapter} from "./UnionAdapterTypes"

export type Section = {
    optClip: Option<AnyClipBoxAdapter>
    sectionFrom: ppqn
    sectionTo: ppqn
}

export interface ClipSequencing extends Terminable {
    iterate(trackKey: UUID.Bytes, a: ppqn, b: ppqn): Generator<Section>
}