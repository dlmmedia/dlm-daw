import {PPQN} from "@dlm-daw/lib-dsp"
import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"

export const TimelineBox: BoxSchema<Pointers> = {
    type: "box",
    class: {
        name: "TimelineBox",
        fields: {
            1: {type: "field", name: "root", pointerRules: {accepts: [Pointers.Timeline], mandatory: true}},
            10: {
                type: "object", name: "signature", class: {
                    name: "Signature",
                    fields: {
                        1: {type: "int32", name: "nominator", value: 4},
                        2: {type: "int32", name: "denominator", value: 4}
                    }
                }
            },
            11: {
                type: "object", name: "loop-area", class: {
                    name: "LoopArea",
                    fields: {
                        1: {type: "boolean", name: "enabled", value: true},
                        2: {type: "int32", name: "from", value: 0},
                        3: {type: "int32", name: "to", value: PPQN.fromSignature(4, 1)}
                    }
                }
            },
            20: { // TODO deprecate
                type: "field",
                name: "deprecated-marker-track",
                pointerRules: {accepts: [Pointers.MarkerTrack], mandatory: false}
            },
            21: {
                type: "object",
                name: "marker-track",
                class: {
                    name: "MarkerTrack",
                    fields: {
                        1: {
                            type: "field",
                            name: "markers",
                            pointerRules: {accepts: [Pointers.MarkerTrack], mandatory: false}
                        },
                        10: {type: "int32", name: "index"},
                        20: {type: "boolean", name: "enabled", value: true}
                    }
                }
            },
            30: {type: "int32", name: "durationInPulses", value: PPQN.fromSignature(128, 1)},
            31: {type: "float32", name: "bpm", value: 120}
        }
    }
}