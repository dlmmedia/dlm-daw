import "./style.css"
import {assert, Progress, UUID} from "@dlm-daw/lib-std"
import {PPQN} from "@dlm-daw/lib-dsp"
import {AnimationFrame, Browser} from "@dlm-daw/lib-dom"
import {Promises} from "@dlm-daw/lib-runtime"
import {AudioData, SampleMetaData} from "@dlm-daw/studio-adapters"
import {AudioWorklets, DefaultSampleLoaderManager, OpenSampleAPI, Project, Workers} from "@dlm-daw/studio-core"
import {testFeatures} from "./features"
import {createExampleProject} from "./ExampleProject"
import WorkersUrl from "@dlm-daw/studio-core/workers-main.js?worker&url"
import WorkletsUrl from "@dlm-daw/studio-core/processors.js?url"

(async () => {
    assert(crossOriginIsolated, "window must be crossOriginIsolated")
    console.debug("booting...")
    console.debug("openDAW -> headless")
    console.debug("Agent", Browser.userAgent)
    console.debug("isLocalHost", Browser.isLocalHost())
    document.body.textContent = "booting..."
    await Workers.install(WorkersUrl)
    AudioWorklets.install(WorkletsUrl)
    {
        const {status, error} = await Promises.tryCatch(testFeatures())
        if (status === "rejected") {
            document.querySelector("#preloader")?.remove()
            alert(`Could not test features (${error})`)
            return
        }
    }
    const context = new AudioContext({latencyHint: 0})
    console.debug(`AudioContext state: ${context.state}, sampleRate: ${context.sampleRate}`)
    const audioWorkletResult = await Promises.tryCatch(AudioWorklets.createFor(context))
    if (audioWorkletResult.status === "rejected") {
        alert(`Could not install Worklets (${(audioWorkletResult.error)})`)
        return
    }
    {
        const sampleAPI = OpenSampleAPI.get()
        const sampleManager = new DefaultSampleLoaderManager({
            fetch: (uuid: UUID.Bytes, progress: Progress.Handler): Promise<[AudioData, SampleMetaData]> =>
                sampleAPI.load(context, uuid, progress)
        })

        const loadProject = false
        const env = {sampleManager, audioWorklets: audioWorkletResult.value, audioContext: context}
        const project = loadProject
            ? Project.load(env, await fetch("subset.od").then(x => x.arrayBuffer()))
            : createExampleProject(env)
        const worklet = AudioWorklets.get(context).createEngine({project: project})
        await worklet.isReady()
        while (!await worklet.queryLoadingComplete()) {}
        worklet.connect(context.destination)
        window.addEventListener("click", () => {
            worklet.play()
            AnimationFrame.add(() => {
                const ppqn = worklet.position.getValue()
                const {bars, beats} = PPQN.toParts(ppqn)
                document.body.textContent = `${bars + 1}:${beats + 1}`
            })
        }, {once: true})
    }
    if (context.state === "suspended") {
        window.addEventListener("click",
            async () => await context.resume().then(() =>
                console.debug(`AudioContext resumed (${context.state})`)), {capture: true, once: true})
    }
    AnimationFrame.start()
    document.body.textContent = "Ready."
})()