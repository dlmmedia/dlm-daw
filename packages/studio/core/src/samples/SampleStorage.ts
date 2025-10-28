import {ByteArrayInput, EmptyExec, UUID} from "@dlm-daw/lib-std"
import {Promises} from "@dlm-daw/lib-runtime"
import {Peaks, SamplePeaks} from "@dlm-daw/lib-fusion"
import {AudioData, Sample, SampleMetaData} from "@dlm-daw/studio-adapters"
import {Workers} from "../Workers"
import {WavFile} from "../WavFile"

export namespace SampleStorage {
    export const clean = () => Workers.Opfs.delete("samples/v1").catch(EmptyExec)

    export const Folder = "samples/v2"

    export type New = {
        uuid: UUID.Bytes,
        audio: AudioData,
        peaks: ArrayBuffer,
        meta: SampleMetaData
    }

    export const saveSample = async ({uuid, audio, peaks, meta}: New): Promise<void> => {
        const path = `${Folder}/${UUID.toString(uuid)}`
        const data = new Uint8Array(WavFile.encodeFloats({
            channels: audio.frames.slice(),
            numFrames: audio.numberOfFrames,
            sampleRate: audio.sampleRate
        }))
        console.debug(`save sample '${path}'`)
        return Promise.all([
            Workers.Opfs.write(`${path}/audio.wav`, data),
            Workers.Opfs.write(`${path}/peaks.bin`, new Uint8Array(peaks)),
            Workers.Opfs.write(`${path}/meta.json`, new TextEncoder().encode(JSON.stringify(meta)))
        ]).then(EmptyExec)
    }

    export const updateSampleMeta = async (uuid: UUID.Bytes, meta: SampleMetaData): Promise<void> => {
        const path = `${Folder}/${UUID.toString(uuid)}`
        return Workers.Opfs.write(`${path}/meta.json`, new TextEncoder().encode(JSON.stringify(meta)))
    }

    export const loadSample = async (uuid: UUID.Bytes): Promise<[AudioData, Peaks, SampleMetaData]> => {
        const path = `${Folder}/${UUID.toString(uuid)}`
        return Promise.all([
            Workers.Opfs.read(`${path}/audio.wav`)
                .then(bytes => WavFile.decodeFloats(bytes.buffer as ArrayBuffer)),
            Workers.Opfs.read(`${path}/peaks.bin`)
                .then(bytes => SamplePeaks.from(new ByteArrayInput(bytes.buffer))),
            Workers.Opfs.read(`${path}/meta.json`)
                .then(bytes => JSON.parse(new TextDecoder().decode(bytes)))
        ]).then(([buffer, peaks, meta]) => [{
            sampleRate: buffer.sampleRate,
            numberOfFrames: buffer.numFrames,
            numberOfChannels: buffer.channels.length,
            frames: buffer.channels
        }, peaks, meta])
    }

    export const deleteSample = async (uuid: UUID.Bytes): Promise<void> => {
        const path = `${Folder}/${UUID.toString(uuid)}`
        const uuids = await loadTrashedIds()
        uuids.push(UUID.toString(uuid))
        await saveTrashedIds(uuids)
        await Workers.Opfs.delete(`${path}`)
    }

    export const loadTrashedIds = async (): Promise<Array<UUID.String>> => {
        const {status, value} = await Promises.tryCatch(Workers.Opfs.read(`${Folder}/trash.json`))
        return status === "rejected" ? [] : JSON.parse(new TextDecoder().decode(value))
    }

    export const saveTrashedIds = async (ids: ReadonlyArray<UUID.String>): Promise<void> => {
        const trash = new TextEncoder().encode(JSON.stringify(ids))
        await Workers.Opfs.write(`${Folder}/trash.json`, trash)
    }

    export const listSamples = async (): Promise<ReadonlyArray<Sample>> => {
        return Workers.Opfs.list(Folder)
            .then(files => Promise.all(files.filter(file => file.kind === "directory")
                .map(async ({name}) => {
                    const array = await Workers.Opfs.read(`${Folder}/${name}/meta.json`)
                    return ({uuid: name as UUID.String, ...(JSON.parse(new TextDecoder().decode(array)) as SampleMetaData)})
                })), () => [])
    }
}