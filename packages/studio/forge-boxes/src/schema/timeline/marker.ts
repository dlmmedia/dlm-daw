import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"

export const MarkerBox: BoxSchema<Pointers> = {
    type: "box",
    class: {
        name: "MarkerBox",
        fields: {
            1: {type: "pointer", name: "track", pointerType: Pointers.MarkerTrack, mandatory: true},
            2: {type: "int32", name: "position"},
            3: {type: "int32", name: "plays", value: 1}, // 0 is infinite plays, 1 is one play (normal), ...n for n plays
            4: {type: "string", name: "label"},
            5: {type: "int32", name: "hue"}
        }
    }, pointerRules: {accepts: [Pointers.Selection], mandatory: false}
}