import {Progress, UUID} from "@dlm-daw/lib-std"
import {Sample} from "@dlm-daw/studio-adapters"

export type SampleImporter = {
    importSample(sample: {
        uuid: UUID.Bytes,
        name: string,
        arrayBuffer: ArrayBuffer,
        progressHandler?: Progress.Handler
    }): Promise<Sample>
}