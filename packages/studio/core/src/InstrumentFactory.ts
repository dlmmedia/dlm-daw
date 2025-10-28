import {IconSymbol, TrackType} from "@dlm-daw/studio-adapters"
import {BoxGraph, Field} from "@dlm-daw/lib-box"

import {InstrumentBox} from "./InstrumentBox"
import {Pointers} from "@dlm-daw/studio-enums"

export interface InstrumentFactory {
    defaultName: string
    defaultIcon: IconSymbol
    description: string
    trackType: TrackType
    create: (boxGraph: BoxGraph,
             host: Field<Pointers.InstrumentHost | Pointers.AudioOutput>,
             name: string,
             icon: IconSymbol) => InstrumentBox
}