import {AudioDeviceProcessor} from "./AudioDeviceProcessor"
import {AudioInput} from "./processing"
import {int} from "@dlm-daw/lib-std"
import {AudioEffectDeviceAdapter} from "@dlm-daw/studio-adapters"

export interface AudioEffectDeviceProcessor extends AudioDeviceProcessor, AudioInput {
    index(): int
    adapter(): AudioEffectDeviceAdapter
}