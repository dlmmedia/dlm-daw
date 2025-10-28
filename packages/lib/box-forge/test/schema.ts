import {PointerRules} from "@dlm-daw/lib-box"
import {BoxForge, ClassSchema, FieldName, FieldRecord, FieldSchema, mergeFields} from "../src"
import {PointerType} from "./Pointers"

const Module = {
    1: {type: "pointer", name: "network", pointerType: PointerType.NetworkModule, mandatory: true},
    2: {type: "int32", name: "x"},
    3: {type: "int32", name: "y"},
    4: {type: "string", name: "label"}
} satisfies FieldRecord<PointerType>

const DefaultParameterPointerRules = {
    accepts: [PointerType.ParameterModulation, PointerType.ParameterAutomation],
    mandatory: false
} satisfies PointerRules<PointerType>
const DefaultAudioInput = {
    type: "field", name: "audioInput", pointerRules: {mandatory: false, accepts: [PointerType.AudioInput]}
} satisfies FieldSchema<PointerType.AudioInput> & FieldName
const DefaultAudioOutput = {
    type: "field", name: "audioOutput", pointerRules: {mandatory: false, accepts: [PointerType.AudioOutput]}
} satisfies FieldSchema<PointerType.AudioOutput> & FieldName

const NetworkBox: ClassSchema<PointerType> = {
    name: "NetworkBox",
    fields: {
        10: {
            type: "field",
            name: "modules",
            pointerRules: {mandatory: false, accepts: [PointerType.NetworkModule]}
        },
        11: {
            type: "field",
            name: "connections",
            pointerRules: {mandatory: false, accepts: [PointerType.AudioConnection]}
        }
    }
}

const AudioConnectionBox: ClassSchema<PointerType> = {
    name: "AudioConnectionBox",
    fields: {
        10: {type: "pointer", name: "network", pointerType: PointerType.AudioConnection, mandatory: true},
        11: {type: "pointer", name: "output", pointerType: PointerType.AudioOutput, mandatory: true},
        12: {type: "pointer", name: "input", pointerType: PointerType.AudioInput, mandatory: true}
    }
}

const DrumBox: ClassSchema<PointerType> = {
    name: "DrumBox",
    fields: mergeFields({
        10: {type: "float32", name: "gain", value: 0.0, pointerRules: DefaultParameterPointerRules},
        11: {type: "float32", name: "cutoff", value: 18000.0, pointerRules: DefaultParameterPointerRules},
        12: {type: "float32", name: "resonance", pointerRules: DefaultParameterPointerRules},
        13: {type: "boolean", name: "compressor", pointerRules: DefaultParameterPointerRules},
        20: {type: "int32", name: "patternIndex"},
        21: {
            type: "array", name: "patterns", length: 28, element: {
                type: "object",
                class: {
                    name: "DrumPattern",
                    fields: {
                        10: {type: "pointer", name: "groove", pointerType: PointerType.Groove, mandatory: false},
                        11: {type: "int32", name: "length", value: 16},
                        12: {type: "int32", name: "scale", value: 960},
                        13: {
                            type: "array", name: "steps", length: 64, element: {
                                type: "object",
                                class: {
                                    name: "DrumStep",
                                    fields: {
                                        10: {type: "int32", name: "key"},
                                        11: {type: "int32", name: "transpose"},
                                        12: {type: "boolean", name: "mode", value: true},
                                        13: {type: "boolean", name: "slide"},
                                        14: {type: "boolean", name: "accent"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        30: DefaultAudioOutput
    }, Module)
}

const DelayBox: ClassSchema<PointerType> = {
    name: "DelayBox",
    fields: mergeFields(Module, {
        10: {type: "float32", name: "delayTime", pointerRules: DefaultParameterPointerRules},
        11: {type: "float32", name: "feedback", pointerRules: DefaultParameterPointerRules},
        12: {type: "float32", name: "wet", pointerRules: DefaultParameterPointerRules},
        13: {type: "float32", name: "dry", pointerRules: DefaultParameterPointerRules},
        30: DefaultAudioInput,
        31: DefaultAudioOutput
    } as const)
}

BoxForge.gen<PointerType>({
    path: "./test/gen",
    pointers: {
        from: "../Pointers",
        enum: "PointerType",
        print: pointer => `PointerType.${PointerType[pointer]}`
    },
    boxes: [NetworkBox, AudioConnectionBox, DrumBox, DelayBox].map(clazz => ({type: "box", class: clazz}))
}).then(() => console.debug("forge complete"))