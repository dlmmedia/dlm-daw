import {Progress, UUID} from "@dlm-daw/lib-std"
import {AudioData, SampleMetaData} from "@dlm-daw/studio-adapters"

export interface SampleProvider {
    fetch(uuid: UUID.Bytes, progress: Progress.Handler): Promise<[AudioData, SampleMetaData]>
}