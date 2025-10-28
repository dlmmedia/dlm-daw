export type SampleMetaData = {
    name: string
    bpm: number
    duration: number
    sample_rate: number
    origin: "dlm-daw" | "recording" | "import"
}