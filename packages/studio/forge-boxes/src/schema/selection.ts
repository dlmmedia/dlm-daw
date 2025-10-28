import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"

export const SelectionBox: BoxSchema<Pointers> = {
    type: "box",
    class: {
        name: "SelectionBox",
        fields: {
            1: {type: "pointer", name: "selection", pointerType: Pointers.Selection, mandatory: true},
            2: {type: "pointer", name: "selectable", pointerType: Pointers.Selection, mandatory: true}
        }
    }
}