import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"
import {createMidiEffectDevice} from "../builder"

export const UnknownMidiEffectDevice: BoxSchema<Pointers> = createMidiEffectDevice("UnknownMidiEffectDeviceBox", {
    10: {type: "string", name: "comment"}
})