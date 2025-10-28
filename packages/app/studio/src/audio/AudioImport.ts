import {Arrays, Progress, UUID} from "@dlm-daw/lib-std"
import {estimateBpm} from "@dlm-daw/lib-dsp"
import {Promises} from "@dlm-daw/lib-runtime"
import {AudioData, Sample, SampleMetaData} from "@dlm-daw/studio-adapters"
import {SampleStorage, Workers} from "@dlm-daw/studio-core"
import {SamplePeaks} from "@dlm-daw/lib-fusion"

export namespace AudioImporter {
    export type Creation = {
        uuid?: UUID.Bytes,
        name: string,
        arrayBuffer: ArrayBuffer,
        progressHandler: Progress.Handler
    }

    export const run = async (context: AudioContext,
                              {uuid, name, arrayBuffer, progressHandler}: Creation): Promise<{
        uuid: UUID.Bytes,
        sample: Sample,
        peaks: ArrayBuffer
        audioData: AudioData
    }> => {
        console.time("UUID.sha256")
        uuid ??= await UUID.sha256(arrayBuffer) // Must run before decodeAudioData laster, because it will detach the ArrayBuffer
        console.timeEnd("UUID.sha256")
        console.time("decodeAudioData")
        const audioResult = await Promises.tryCatch(context.decodeAudioData(arrayBuffer))
        console.timeEnd("decodeAudioData")
        if (audioResult.status === "rejected") {return Promise.reject(name)}
        const {value: audioBuffer} = audioResult
        console.debug(`Imported ${audioBuffer.duration.toFixed(1)} seconds`)
        const audioData: AudioData = {
            sampleRate: audioBuffer.sampleRate,
            numberOfFrames: audioBuffer.length,
            numberOfChannels: audioBuffer.numberOfChannels,
            frames: Arrays.create(index => audioBuffer.getChannelData(index), audioBuffer.numberOfChannels)
        }
        const shifts = SamplePeaks.findBestFit(audioData.numberOfFrames)
        const peaks = await Workers.Peak.generateAsync(
            progressHandler,
            shifts,
            audioData.frames,
            audioData.numberOfFrames,
            audioData.numberOfChannels) as ArrayBuffer
        const meta: SampleMetaData = {
            bpm: estimateBpm(audioBuffer.duration),
            name: name.substring(0, name.lastIndexOf(".")),
            duration: audioBuffer.duration,
            sample_rate: audioBuffer.sampleRate,
            origin: "import"
        }
        await SampleStorage.saveSample({uuid, audio: audioData, peaks, meta})
        return {
            uuid,
            sample: {uuid: UUID.toString(uuid), ...meta},
            peaks,
            audioData
        }
    }
}