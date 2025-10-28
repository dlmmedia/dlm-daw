import {AudioUnitBox, TrackBox} from "@dlm-daw/studio-boxes"
import {InstrumentBox} from "./InstrumentBox"

export type InstrumentProduct = {
    audioUnitBox: AudioUnitBox
    instrumentBox: InstrumentBox
    trackBox: TrackBox
}