import {AudioData, SampleMetaData} from "@dlm-daw/studio-adapters"
import {Arrays, Progress, UUID} from "@dlm-daw/lib-std"
import {InstrumentFactories, Project, SampleStorage, Workers} from "@dlm-daw/studio-core"
import {SamplePeaks} from "@dlm-daw/lib-fusion"
import {estimateBpm, PPQN} from "@dlm-daw/lib-dsp"
import {AudioFileBox, AudioRegionBox} from "@dlm-daw/studio-boxes"

export const importSample = async ({api, boxGraph, timelineBox, rootBox}
                                   : Project, name: string, arrayBuffer: ArrayBuffer, context: AudioContext) => {
    // setting up an audio-unit with a Tape device
    const {trackBox, audioUnitBox} = api.createInstrument(InstrumentFactories.Tape)
    // route to output
    audioUnitBox.output.refer(rootBox.outputDevice)
    // using web-audio-api to decode the audio file
    const audioBuffer = await context.decodeAudioData(arrayBuffer)
    // convert into openDAWs own AudioData type
    const audioData: AudioData = {
        sampleRate: audioBuffer.sampleRate,
        numberOfFrames: audioBuffer.length,
        numberOfChannels: audioBuffer.numberOfChannels,
        frames: Arrays.create(index => audioBuffer.getChannelData(index), audioBuffer.numberOfChannels)
    }
    // create peaks for rendering waveforms
    const peaks = await Workers.Peak.generateAsync(
        Progress.Empty,
        SamplePeaks.findBestFit(audioData.numberOfFrames),
        audioData.frames,
        audioData.numberOfFrames,
        audioData.numberOfChannels) as ArrayBuffer
    // create SampleMetaData (this does not affect playback)
    const meta: SampleMetaData = {
        bpm: estimateBpm(audioBuffer.duration),
        name: name.substring(0, name.lastIndexOf(".")),
        duration: audioBuffer.duration,
        sample_rate: audioBuffer.sampleRate,
        origin: "recording"
    }
    // create the uuid to identify the sample in future (must be uploaded as well)
    const uuid = UUID.generate()
    await SampleStorage.saveSample({uuid: uuid, audio: audioData, peaks: peaks, meta: meta})
    // create a FileBox with the SAME uuid that will be connected to regions or clips.
    const audioFileBox = AudioFileBox.create(boxGraph, uuid, box => {
        box.fileName.setValue(name)
        box.startInSeconds.setValue(0)
        box.endInSeconds.setValue(audioBuffer.duration)
    })
    // create an audio region (since we have no unstretched playback yet, we convert the duration into pulses)
    const duration = PPQN.secondsToPulses(audioBuffer.duration, timelineBox.bpm.getValue())
    AudioRegionBox.create(boxGraph, UUID.generate(), box => {
        box.file.refer(audioFileBox)
        box.position.setValue(0)
        box.duration.setValue(duration)
        box.loopDuration.setValue(duration)
        box.regions.refer(trackBox.regions)
    })
}