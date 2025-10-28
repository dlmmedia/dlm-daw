import {BoxSchema} from "@dlm-daw/lib-box-forge"
import {Pointers} from "@dlm-daw/studio-enums"

export const AudioFileBox: BoxSchema<Pointers> = {
    type: "box",
    class: {
        name: "AudioFileBox",
        fields: {
            1: {type: "int32", name: "start-in-seconds"}, // deprecate
            2: {type: "int32", name: "end-in-seconds"}, // deprecate
            3: {type: "string", name: "file-name"}
        }
    }, pointerRules: {accepts: [Pointers.AudioFile], mandatory: true}
}