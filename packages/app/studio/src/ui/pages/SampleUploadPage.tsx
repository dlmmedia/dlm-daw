import css from "./SampleUploadPage.sass?inline"
import {createElement, PageContext, PageFactory} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {Files, Html} from "@dlm-daw/lib-dom"
import {Dialogs} from "@/ui/components/dialogs.tsx"
import {estimateBpm} from "@dlm-daw/lib-dsp"
import {FilePickerAcceptTypes, WavFile} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "SampleUploadPage")

export const SampleUploadPage: PageFactory<StudioService> = ({service}: PageContext<StudioService>) => {
    return (
        <div className={className}>
            <h1>Upload Sample</h1>
            <div>
                <button onclick={async () => {
                    try {
                        const [file] = await Files.open(FilePickerAcceptTypes.WavFiles)
                        const arrayBuffer = await file.arrayBuffer()
                        if (arrayBuffer.byteLength === 0) {return}
                        const buffer = await service.audioContext.decodeAudioData(arrayBuffer.slice())
                        if (arrayBuffer.byteLength === 0) {return}
                        const name = file.name.substring(0, file.name.lastIndexOf(".wav"))
                        const sample_rate = buffer.sampleRate
                        const duration = buffer.duration
                        const bpm = estimateBpm(duration)
                        const wav = WavFile.encodeFloats(buffer)
                        console.debug("name", name)
                        console.debug("sampleRate", sample_rate)
                        console.debug("duration", duration)
                        console.debug("bpm", bpm)
                        await service.sampleAPI.upload(wav, {name, bpm, sample_rate, duration, origin: "dlm-daw"})
                    } catch (error) {
                        if (error instanceof DOMException && error.name === "AbortError") {
                            console.debug("Caught an AbortError")
                        } else {
                            Dialogs.info({message: String(error)}).finally()
                        }
                    }
                }}>
                    Browse
                </button>
            </div>
        </div>
    )
}