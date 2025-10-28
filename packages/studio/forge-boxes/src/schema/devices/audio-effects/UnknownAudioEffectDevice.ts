import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"
import {createAudioEffectDevice} from "../builder"

export const UnknownAudioEffectDevice: BoxSchema<Pointers> = createAudioEffectDevice("UnknownAudioEffectDeviceBox", {
    10: {type: "string", name: "comment"}
})