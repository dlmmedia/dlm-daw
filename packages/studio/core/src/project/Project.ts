import {
    Arrays,
    ByteArrayOutput,
    Option,
    panic,
    Procedure,
    safeExecute,
    Terminable,
    TerminableOwner,
    Terminator,
    UUID
} from "@dlm-daw/lib-std"
import {BoxGraph, Editing} from "@dlm-daw/lib-box"
import {
    AudioBusBox,
    AudioUnitBox,
    BoxIO,
    BoxVisitor,
    GrooveShuffleBox,
    RootBox,
    TimelineBox,
    TrackBox,
    UserInterfaceBox
} from "@dlm-daw/studio-boxes"
import {
    BoxAdapters,
    BoxAdaptersContext,
    ClipSequencing,
    IconSymbol,
    MandatoryBoxes,
    ParameterFieldAdapters,
    ProcessorOptions,
    ProjectDecoder,
    RootBoxAdapter,
    SampleLoaderManager,
    TimelineBoxAdapter,
    UnionBoxTypes,
    UserEditingManager,
    VertexSelection
} from "@dlm-daw/studio-adapters"
import {LiveStreamBroadcaster, LiveStreamReceiver} from "@dlm-daw/lib-fusion"
import {AudioUnitType} from "@dlm-daw/studio-enums"
import {ProjectEnv} from "./ProjectEnv"
import {Mixer} from "../Mixer"
import {ProjectApi} from "./ProjectApi"
import {ProjectMigration} from "./ProjectMigration"
import {CaptureDevices} from "../capture/CaptureDevices"
import {EngineFacade} from "../EngineFacade"
import {EngineWorklet} from "../EngineWorklet"
import {Recording} from "../capture/Recording"
import {MIDILearning} from "../midi/MIDILearning"

export type RestartWorklet = { unload: Procedure<unknown>, load: Procedure<EngineWorklet> }

// Main Entry Point for a Project
export class Project implements BoxAdaptersContext, Terminable, TerminableOwner {
    static new(env: ProjectEnv): Project {
        const boxGraph = new BoxGraph<BoxIO.TypeMap>(Option.wrap(BoxIO.create))
        const isoString = new Date().toISOString()
        console.debug(`New Project created on ${isoString}`)
        boxGraph.beginTransaction()
        const grooveShuffleBox = GrooveShuffleBox.create(boxGraph, UUID.generate(), box => {
            box.label.setValue("Groove Shuffle")
        })
        const rootBox = RootBox.create(boxGraph, UUID.generate(), box => {
            box.groove.refer(grooveShuffleBox)
            box.created.setValue(isoString)
        })
        const userInterfaceBox = UserInterfaceBox.create(boxGraph, UUID.generate())
        const masterBusBox = AudioBusBox.create(boxGraph, UUID.generate(), box => {
            box.collection.refer(rootBox.audioBusses)
            box.label.setValue("Output")
            box.icon.setValue(IconSymbol.toName(IconSymbol.SpeakerHeadphone))
            box.color.setValue(/*Colors.blue*/ "hsl(189, 100%, 65%)") // TODO
        })
        const masterAudioUnit = AudioUnitBox.create(boxGraph, UUID.generate(), box => {
            box.type.setValue(AudioUnitType.Output)
            box.collection.refer(rootBox.audioUnits)
            box.output.refer(rootBox.outputDevice)
            box.index.setValue(0)
        })
        const timelineBox = TimelineBox.create(boxGraph, UUID.generate())
        rootBox.timeline.refer(timelineBox.root)
        userInterfaceBox.root.refer(rootBox.users)
        masterBusBox.output.refer(masterAudioUnit.input)
        boxGraph.endTransaction()
        return new Project(env, boxGraph, {
            rootBox,
            userInterfaceBox,
            masterBusBox,
            masterAudioUnit,
            timelineBox
        })
    }

    static load(env: ProjectEnv, arrayBuffer: ArrayBuffer): Project {
        const skeleton = ProjectDecoder.decode(arrayBuffer)
        ProjectMigration.migrate(skeleton)
        return new Project(env, skeleton.boxGraph, skeleton.mandatoryBoxes)
    }

    static skeleton(env: ProjectEnv, skeleton: ProjectDecoder.Skeleton): Project {
        ProjectMigration.migrate(skeleton)
        return new Project(env, skeleton.boxGraph, skeleton.mandatoryBoxes)
    }

    readonly #terminator = new Terminator()

    readonly #env: ProjectEnv
    readonly boxGraph: BoxGraph<BoxIO.TypeMap>

    readonly rootBox: RootBox
    readonly userInterfaceBox: UserInterfaceBox
    readonly masterBusBox: AudioBusBox
    readonly masterAudioUnit: AudioUnitBox
    readonly timelineBox: TimelineBox

    readonly api: ProjectApi
    readonly captureDevices: CaptureDevices
    readonly editing: Editing
    readonly selection: VertexSelection
    readonly boxAdapters: BoxAdapters
    readonly userEditingManager: UserEditingManager
    readonly parameterFieldAdapters: ParameterFieldAdapters
    readonly liveStreamReceiver: LiveStreamReceiver
    readonly midiLearning: MIDILearning
    readonly mixer: Mixer
    readonly engine = new EngineFacade()

    private constructor(env: ProjectEnv, boxGraph: BoxGraph, {
        rootBox,
        userInterfaceBox,
        masterBusBox,
        masterAudioUnit,
        timelineBox
    }: MandatoryBoxes) {
        this.#env = env
        this.boxGraph = boxGraph
        this.rootBox = rootBox
        this.userInterfaceBox = userInterfaceBox
        this.masterBusBox = masterBusBox
        this.masterAudioUnit = masterAudioUnit
        this.timelineBox = timelineBox

        this.api = new ProjectApi(this)
        this.editing = new Editing(this.boxGraph)
        this.selection = new VertexSelection(this.editing, this.boxGraph)
        this.parameterFieldAdapters = new ParameterFieldAdapters()
        this.boxAdapters = this.#terminator.own(new BoxAdapters(this))
        this.userEditingManager = new UserEditingManager(this.editing)
        this.userEditingManager.follow(this.userInterfaceBox)
        this.selection.switch(this.userInterfaceBox.selection)
        this.liveStreamReceiver = this.#terminator.own(new LiveStreamReceiver())
        this.midiLearning = this.#terminator.own(new MIDILearning(this))
        this.captureDevices = this.#terminator.own(new CaptureDevices(this))
        this.mixer = new Mixer(this.rootBoxAdapter.audioUnits)

        console.debug(`Project was created on ${this.rootBoxAdapter.created.toString()}`)
    }

    startAudioWorklet(restart?: RestartWorklet, options?: ProcessorOptions): EngineWorklet {
        console.debug(`start AudioWorklet`)
        const lifecycle = this.#terminator.spawn()
        const engine: EngineWorklet = lifecycle.own(this.#env.audioWorklets.createEngine({project: this, options}))
        const handler = async (event: unknown) => {
            console.warn(event)
            // we will only accept the first error
            engine.removeEventListener("error", handler)
            engine.removeEventListener("processorerror", handler)
            safeExecute(restart?.unload, event)
            lifecycle.terminate()
            safeExecute(restart?.load, this.startAudioWorklet(restart))
        }
        engine.addEventListener("error", handler)
        engine.addEventListener("processorerror", handler)
        engine.connect(engine.context.destination)
        this.engine.setWorklet(engine)
        return engine
    }

    startRecording(countIn: boolean = true): void {
        this.engine.assertWorklet()
        if (Recording.isRecording) {return}
        Recording.start(this, countIn).finally()
    }

    own<T extends Terminable>(terminable: T): T {return this.#terminator.own<T>(terminable)}
    ownAll<T extends Terminable>(...terminables: Array<T>): void {return this.#terminator.ownAll<T>(...terminables)}
    spawn(): Terminator {return this.#terminator.spawn()}

    get env(): ProjectEnv {return this.#env}
    get bpm(): number {return this.timelineBox.bpm.getValue()}
    get rootBoxAdapter(): RootBoxAdapter {return this.boxAdapters.adapterFor(this.rootBox, RootBoxAdapter)}
    get timelineBoxAdapter(): TimelineBoxAdapter {return this.boxAdapters.adapterFor(this.timelineBox, TimelineBoxAdapter)}
    get sampleManager(): SampleLoaderManager {return this.#env.sampleManager}
    get clipSequencing(): ClipSequencing {return panic("Only available in audio context")}
    get isAudioContext(): boolean {return false}
    get isMainThread(): boolean {return true}
    get liveStreamBroadcaster(): LiveStreamBroadcaster {return panic("Only available in audio context")}

    get skeleton(): ProjectDecoder.Skeleton {
        return {
            boxGraph: this.boxGraph,
            mandatoryBoxes: {
                rootBox: this.rootBox,
                timelineBox: this.timelineBox,
                masterBusBox: this.masterBusBox,
                masterAudioUnit: this.masterAudioUnit,
                userInterfaceBox: this.userInterfaceBox
            }
        }
    }

    toArrayBuffer(): ArrayBufferLike {
        const output = ByteArrayOutput.create()
        output.writeInt(ProjectDecoder.MAGIC_HEADER_OPEN)
        output.writeInt(ProjectDecoder.FORMAT_VERSION)
        // store all boxes
        const boxGraphChunk = this.boxGraph.toArrayBuffer()
        output.writeInt(boxGraphChunk.byteLength)
        output.writeBytes(new Int8Array(boxGraphChunk))
        // store mandatory boxes' addresses
        UUID.toDataOutput(output, this.rootBox.address.uuid)
        UUID.toDataOutput(output, this.userInterfaceBox.address.uuid)
        UUID.toDataOutput(output, this.masterBusBox.address.uuid)
        UUID.toDataOutput(output, this.masterAudioUnit.address.uuid)
        UUID.toDataOutput(output, this.timelineBox.address.uuid)
        return output.toArrayBuffer()
    }

    copy(env?: Partial<ProjectEnv>): Project {
        return Project.load({...this.#env, ...env}, this.toArrayBuffer() as ArrayBuffer)
    }

    invalid(): boolean {
        return this.boxGraph.boxes().some(box => box.accept<BoxVisitor<boolean>>({
            visitTrackBox: (box: TrackBox): boolean => {
                for (const {current, next} of Arrays.iterateAdjacent(box.regions.pointerHub.incoming()
                    .map(({box}) => UnionBoxTypes.asRegionBox(box))
                    .sort(({position: a}, {position: b}) => a.getValue() - b.getValue()))) {
                    if (current.position.getValue() + current.duration.getValue() > next.position.getValue()) {
                        return true
                    }
                }
                return false
            }
        }) ?? false)
    }

    terminate(): void {
        console.debug("Project terminated")
        this.#terminator.terminate()
    }
}