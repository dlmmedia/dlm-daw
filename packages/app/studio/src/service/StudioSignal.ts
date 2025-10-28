import {Sample} from "@dlm-daw/studio-adapters"
import {ProjectMeta} from "@dlm-daw/studio-core"

export type StudioSignal =
    | {
    type: "reset-peaks"
} | {
    type: "import-sample", sample: Sample
} | {
    type: "delete-project", meta: ProjectMeta
}