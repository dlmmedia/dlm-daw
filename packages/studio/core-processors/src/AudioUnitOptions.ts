import {ExportStemConfiguration} from "@dlm-daw/studio-adapters"

export type AudioUnitOptions = Omit<ExportStemConfiguration, "fileName">

export namespace AudioUnitOptions {
    export const Default: AudioUnitOptions = {includeAudioEffects: true, includeSends: true}
}