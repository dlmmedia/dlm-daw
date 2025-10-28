import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"
import {DefaultParameterPointerRules} from "../../defaults"
import {createMidiEffectDevice} from "../builder"

export const PitchDeviceBox: BoxSchema<Pointers> = createMidiEffectDevice("PitchDeviceBox", {
    10: {type: "int32", name: "semi-tones", pointerRules: DefaultParameterPointerRules},
    11: {type: "float32", name: "cents", pointerRules: DefaultParameterPointerRules},
    12: {type: "int32", name: "octaves", pointerRules: DefaultParameterPointerRules}
})