import {Option} from "@dlm-daw/lib-std"
import {NoteEventTarget} from "./NoteEventSource"
import {DeviceProcessor} from "./DeviceProcessor"

import {AudioDeviceProcessor} from "./AudioDeviceProcessor"

export interface InstrumentDeviceProcessor extends AudioDeviceProcessor {
    get noteEventTarget(): Option<NoteEventTarget & DeviceProcessor>
}