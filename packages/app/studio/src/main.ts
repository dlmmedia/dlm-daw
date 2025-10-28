import "./main.sass"
import {App} from "@/ui/App.tsx"
import {panic, Procedure, RuntimeNotification, RuntimeNotifier, unitValue, UUID} from "@dlm-daw/lib-std"
import {StudioService} from "@/service/StudioService"
import {AudioData, SampleMetaData} from "@dlm-daw/studio-adapters"
import {Dialogs} from "@/ui/components/dialogs.tsx"
import {installCursors} from "@/ui/Cursors.ts"
import {BuildInfo} from "./BuildInfo"
import {Surface} from "@/ui/surface/Surface.tsx"
import {replaceChildren} from "@dlm-daw/lib-jsx"
import {ContextMenu} from "@/ui/ContextMenu.ts"
import {Spotlight} from "@/ui/spotlight/Spotlight.tsx"
import {testFeatures} from "@/features.ts"
import {MissingFeature} from "@/ui/MissingFeature.tsx"
import {UpdateMessage} from "@/ui/UpdateMessage.tsx"
import {showStoragePersistDialog} from "@/AppDialogs"
import {Promises} from "@dlm-daw/lib-runtime"
import {AnimationFrame, Browser, Events, Keyboard} from "@dlm-daw/lib-dom"
import {AudioOutputDevice} from "@/audio/AudioOutputDevice"
import {FontLoader} from "@/ui/FontLoader"
import {ErrorHandler} from "@/errors/ErrorHandler.ts"
import {
    AudioWorklets,
    CloudAuthManager,
    DefaultSampleLoaderManager,
    OpenSampleAPI,
    SampleProvider,
    SampleStorage,
    Workers
} from "@dlm-daw/studio-core"

import WorkersUrl from "@dlm-daw/studio-core/workers-main.js?worker&url"
import WorkletsUrl from "@dlm-daw/studio-core/processors.js?url"

window.name = "main"

const loadBuildInfo = async () => fetch(`/build-info.json?v=${Date.now()}`)
    .then(x => x.json().then(x => x as BuildInfo))

;(async () => {
        console.time("boot")
        if (!window.crossOriginIsolated) {return panic("window must be crossOriginIsolated")}
        console.debug("booting...")
        await FontLoader.load()
        await Workers.install(WorkersUrl)
        AudioWorklets.install(WorkletsUrl)
        const testFeaturesResult = await Promises.tryCatch(testFeatures())
        if (testFeaturesResult.status === "rejected") {
            document.querySelector("#preloader")?.remove()
            replaceChildren(document.body, MissingFeature({error: testFeaturesResult.error}))
            return
        }
        const buildInfo: BuildInfo = await loadBuildInfo()
        console.debug("buildInfo", buildInfo)
        console.debug("isLocalHost", Browser.isLocalHost())
        console.debug("agent", Browser.userAgent)
        const sampleRate = Browser.isFirefox() ? undefined : 48000
        console.debug("requesting custom sampleRate", sampleRate ?? "'No (Firefox)'")
        const context = new AudioContext({sampleRate, latencyHint: 0})
        console.debug(`AudioContext state: ${context.state}, sampleRate: ${context.sampleRate}`)
        const audioWorklets = await Promises.tryCatch(AudioWorklets.createFor(context))
        if (audioWorklets.status === "rejected") {
            return panic(audioWorklets.error)
        }
        if (context.state === "suspended") {
            window.addEventListener("click",
                async () => await context.resume().then(() =>
                    console.debug(`AudioContext resumed (${context.state})`)), {capture: true, once: true})
        }
        const audioDevices = await AudioOutputDevice.create(context)
        const sampleAPI = OpenSampleAPI.get()
        const sampleManager = new DefaultSampleLoaderManager({
            fetch: async (uuid: UUID.Bytes, progress: Procedure<unitValue>): Promise<[AudioData, SampleMetaData]> =>
                sampleAPI.load(context, uuid, progress)
        } satisfies SampleProvider)
        const cloudAuthManager = CloudAuthManager.create()
        const service: StudioService =
            new StudioService(context, audioWorklets.value, audioDevices, sampleAPI, sampleManager, cloudAuthManager, buildInfo)
        const errorHandler = new ErrorHandler(service)
        const surface = Surface.main({
            config: (surface: Surface) => {
                surface.ownAll(
                    Events.subscribe(surface.owner, "keydown", event => {
                        if (Keyboard.isControlKey(event) && event.key.toLowerCase() === "z") {
                            if (event.shiftKey) {
                                service.runIfProject(project => project.editing.redo())
                            } else {
                                service.runIfProject(project => project.editing.undo())
                            }
                        } else if (event.defaultPrevented) {return}
                    }),
                    ContextMenu.install(surface.owner),
                    Spotlight.install(surface, service)
                )
            }
        }, errorHandler)
        document.querySelector("#preloader")?.remove()
        document.addEventListener("touchmove", (event: TouchEvent) => event.preventDefault(), {passive: false})
        replaceChildren(surface.ground, App(service))
        AnimationFrame.start()
        installCursors()
        RuntimeNotifier.install({
            info: (request) => Dialogs.info(request),
            approve: (request) => Dialogs.approve({...request, reverse: true}),
            progress: (request): RuntimeNotification.ProgressUpdater => Dialogs.progress(request)
        })
        if (buildInfo.env === "production" && !Browser.isLocalHost()) {
            const uuid = buildInfo.uuid
            const sourceCss = document.querySelector<HTMLLinkElement>("link[rel='stylesheet']")?.href ?? ""
            const sourceCode = document.querySelector<HTMLScriptElement>("script[src]")?.src ?? ""
            if (!sourceCss.includes(uuid) || !sourceCode.includes(uuid)) {
                console.warn("Cache issue:")
                console.warn("expected uuid", uuid)
                console.warn("sourceCss", sourceCss)
                console.warn("sourceCode", sourceCode)
                Dialogs.cache()
                return
            }
            const checkExtensions = setInterval(() => {
                if (document.scripts.length > 1) {
                    Dialogs.info({
                        headline: "Warning",
                        message: "Please disable extensions to avoid undefined behavior.",
                        okText: "Ignore"
                    }).finally()
                    clearInterval(checkExtensions)
                }
            }, 5_000)
            const checkUpdates = setInterval(async () => {
                if (!navigator.onLine) {return}
                const {status, value: newBuildInfo} = await Promises.tryCatch(loadBuildInfo())
                if (status === "resolved" && newBuildInfo.uuid !== undefined && newBuildInfo.uuid !== buildInfo.uuid) {
                    document.body.prepend(UpdateMessage())
                    console.warn("A new version is online.")
                    clearInterval(checkUpdates)
                }
            }, 5_000)
        } else {
            console.debug("No production checks (build version & updates).")
        }
        if (Browser.isFirefox()) {
            const persisted = await Promises.tryCatch(navigator.storage.persisted())
            console.debug("Firefox.isPersisted", persisted.value)
            if (persisted.status === "resolved" && !persisted.value) {
                await Promises.tryCatch(showStoragePersistDialog())
            }
        }
        // delete obsolete indexedDB
        try {indexedDB.deleteDatabase("audio-file-cache")} catch (_: any) {}
        // delete obsolete samples
        SampleStorage.clean().then()
        console.timeEnd("boot")
    }
)()