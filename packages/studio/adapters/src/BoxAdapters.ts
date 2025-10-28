import {
    asDefined,
    assert,
    AssertType,
    Class,
    isDefined,
    panic,
    SortedSet,
    Subscription,
    Terminable,
    UUID
} from "@dlm-daw/lib-std"
import {Box, Update} from "@dlm-daw/lib-box"
import {
    ArpeggioDeviceBox,
    AudioBusBox,
    AudioClipBox,
    AudioFileBox,
    AudioRegionBox,
    AudioUnitBox,
    AuxSendBox,
    BoxVisitor,
    DelayDeviceBox,
    DeviceInterfaceKnobBox,
    GrooveShuffleBox,
    MarkerBox,
    ModularAudioInputBox,
    ModularAudioOutputBox,
    ModularBox,
    ModularDeviceBox,
    ModuleConnectionBox,
    ModuleDelayBox,
    ModuleGainBox,
    ModuleMultiplierBox,
    NanoDeviceBox,
    NoteClipBox,
    NoteEventBox,
    NoteEventCollectionBox,
    NoteRegionBox,
    PitchDeviceBox,
    PlayfieldDeviceBox,
    PlayfieldSampleBox,
    RevampDeviceBox,
    ReverbDeviceBox,
    RootBox,
    StereoToolDeviceBox,
    TapeDeviceBox,
    TimelineBox,
    TrackBox,
    UnknownAudioEffectDeviceBox,
    UnknownMidiEffectDeviceBox,
    ValueClipBox,
    ValueEventBox,
    ValueEventCollectionBox,
    ValueRegionBox,
    VaporisateurDeviceBox,
    ZeitgeistDeviceBox
} from "@dlm-daw/studio-boxes"
import {AudioUnitBoxAdapter} from "./audio-unit/AudioUnitBoxAdapter"
import {DelayDeviceBoxAdapter} from "./devices/audio-effects/DelayDeviceBoxAdapter"
import {ReverbDeviceBoxAdapter} from "./devices/audio-effects/ReverbDeviceBoxAdapter"
import {RevampDeviceBoxAdapter} from "./devices/audio-effects/RevampDeviceBoxAdapter"
import {AudioFileBoxAdapter} from "./audio/AudioFileBoxAdapter"
import {AudioRegionBoxAdapter} from "./timeline/region/AudioRegionBoxAdapter"
import {TimelineBoxAdapter} from "./timeline/TimelineBoxAdapter"
import {MarkerBoxAdapter} from "./timeline/MarkerBoxAdapter"
import {ModularAdapter} from "./modular/modular"
import {ModuleDelayAdapter} from "./modular/modules/delay"
import {ModuleMultiplierAdapter} from "./modular/modules/multiplier"
import {ModuleConnectionAdapter} from "./modular/connection"
import {ModularAudioOutputAdapter} from "./modular/modules/audio-output"
import {ModularAudioInputAdapter} from "./modular/modules/audio-input"
import {ModularDeviceBoxAdapter} from "./devices/audio-effects/ModularDeviceBoxAdapter"
import {DeviceInterfaceKnobAdapter} from "./modular/user-interface"
import {ModuleGainAdapter} from "./modular/modules/gain"
import {AudioBusBoxAdapter} from "./audio-unit/AudioBusBoxAdapter"
import {AuxSendBoxAdapter} from "./audio-unit/AuxSendBoxAdapter"
import {RootBoxAdapter} from "./RootBoxAdapter"
import {NoteEventBoxAdapter} from "./timeline/event/NoteEventBoxAdapter"
import {NoteRegionBoxAdapter} from "./timeline/region/NoteRegionBoxAdapter"
import {NoteEventCollectionBoxAdapter} from "./timeline/collection/NoteEventCollectionBoxAdapter"
import {ValueEventBoxAdapter} from "./timeline/event/ValueEventBoxAdapter"
import {ValueRegionBoxAdapter} from "./timeline/region/ValueRegionBoxAdapter"
import {ValueEventCollectionBoxAdapter} from "./timeline/collection/ValueEventCollectionBoxAdapter"
import {NoteClipBoxAdapter} from "./timeline/clip/NoteClipBoxAdapter"
import {AudioClipBoxAdapter} from "./timeline/clip/AudioClipBoxAdapter"
import {ValueClipBoxAdapter} from "./timeline/clip/ValueClipBoxAdapter"
import {TrackBoxAdapter} from "./timeline/TrackBoxAdapter"
import {TapeDeviceBoxAdapter} from "./devices/instruments/TapeDeviceBoxAdapter"
import {VaporisateurDeviceBoxAdapter} from "./devices/instruments/VaporisateurDeviceBoxAdapter"
import {ArpeggioDeviceBoxAdapter} from "./devices/midi-effects/ArpeggioDeviceBoxAdapter"
import {PitchDeviceBoxAdapter} from "./devices/midi-effects/PitchDeviceBoxAdapter"
import {NanoDeviceBoxAdapter} from "./devices/instruments/NanoDeviceBoxAdapter"
import {PlayfieldDeviceBoxAdapter} from "./devices/instruments/PlayfieldDeviceBoxAdapter"
import {StereoToolDeviceBoxAdapter} from "./devices/audio-effects/StereoToolDeviceBoxAdapter"
import {PlayfieldSampleBoxAdapter} from "./devices/instruments/Playfield/PlayfieldSampleBoxAdapter"
import {BoxAdaptersContext} from "./BoxAdaptersContext"
import {BoxAdapter} from "./BoxAdapter"
import {ZeitgeistDeviceBoxAdapter} from "./devices/midi-effects/ZeitgeistDeviceBoxAdapter"
import {GrooveShuffleBoxAdapter} from "./grooves/GrooveShuffleBoxAdapter"
import {UnknownAudioEffectDeviceBoxAdapter} from "./devices/audio-effects/UnknownAudioEffectDeviceBoxAdapter"
import {UnknownMidiEffectDeviceBoxAdapter} from "./devices/midi-effects/UnknownMidiEffectDeviceBoxAdapter"

export class BoxAdapters implements Terminable {
    readonly #context: BoxAdaptersContext
    readonly #adapters: SortedSet<UUID.Bytes, BoxAdapter>
    readonly #deleted: Set<Box>

    #terminable: Subscription

    constructor(context: BoxAdaptersContext) {
        this.#context = context
        this.#adapters = UUID.newSet<BoxAdapter>(adapter => adapter.uuid)
        this.#deleted = new Set<Box>()

        this.#terminable = this.#context.boxGraph.subscribeToAllUpdates({
            onUpdate: (update: Update) => {
                if (update.type === "delete") {
                    const adapter = this.#adapters.getOrNull(update.uuid)
                    if (isDefined(adapter)) {
                        this.#deleted.add(adapter.box)
                        this.#adapters.removeByValue(adapter).terminate()
                    }
                }
            }
        })
    }

    terminate(): void {
        this.#adapters.values().forEach(adapter => adapter.terminate())
        this.#adapters.clear()
        this.#terminable.terminate()
    }

    adapterFor<BOX extends Box, T extends BoxAdapter>(box: BOX, checkType: Class<T> | AssertType<T>): T {
        if (this.#deleted.has(box)) {
            return panic(`Cannot resolve adapter for already deleted box: ${box}`)
        }
        let adapter = this.#adapters.getOrNull(box.address.uuid)
        if (adapter === null) {
            adapter = this.#create(box)
            const added = this.#adapters.add(adapter)
            assert(added, `Could not add adapter for ${box}`)
        }
        if (typeof checkType === "function") {
            return Object.hasOwn(checkType, "prototype")
                ? adapter instanceof checkType ? adapter as T : panic(`${adapter} is not instance of ${checkType}`)
                : (checkType as AssertType<T>)(adapter) ? adapter as T : panic(`${adapter} did not pass custom type guard`)
        }
        return panic("Unknown checkType method")
    }

    #create(unknownBox: Box): BoxAdapter {
        return asDefined(unknownBox.accept<BoxVisitor<BoxAdapter>>({
            visitRootBox: (box: RootBox): BoxAdapter => new RootBoxAdapter(this.#context, box),
            visitArpeggioDeviceBox: (box: ArpeggioDeviceBox) => new ArpeggioDeviceBoxAdapter(this.#context, box),
            visitPitchDeviceBox: (box: PitchDeviceBox) => new PitchDeviceBoxAdapter(this.#context, box),
            visitStereoToolDeviceBox: (box: StereoToolDeviceBox) => new StereoToolDeviceBoxAdapter(this.#context, box),
            visitDelayDeviceBox: (box: DelayDeviceBox) => new DelayDeviceBoxAdapter(this.#context, box),
            visitReverbDeviceBox: (box: ReverbDeviceBox) => new ReverbDeviceBoxAdapter(this.#context, box),
            visitRevampDeviceBox: (box: RevampDeviceBox) => new RevampDeviceBoxAdapter(this.#context, box),
            visitUnknownAudioEffectDeviceBox: (box: UnknownAudioEffectDeviceBox) => new UnknownAudioEffectDeviceBoxAdapter(this.#context, box),
            visitPlayfieldDeviceBox: (box: PlayfieldDeviceBox) => new PlayfieldDeviceBoxAdapter(this.#context, box),
            visitPlayfieldSampleBox: (box: PlayfieldSampleBox) => new PlayfieldSampleBoxAdapter(this.#context, box),
            visitModularDeviceBox: (box: ModularDeviceBox) => new ModularDeviceBoxAdapter(this.#context, box),
            visitTapeDeviceBox: (box: TapeDeviceBox) => new TapeDeviceBoxAdapter(this.#context, box),
            visitNanoDeviceBox: (box: NanoDeviceBox) => new NanoDeviceBoxAdapter(this.#context, box),
            visitVaporisateurDeviceBox: (box: VaporisateurDeviceBox) => new VaporisateurDeviceBoxAdapter(this.#context, box),
            visitModularBox: (box: ModularBox) => new ModularAdapter(this.#context, box),
            visitModuleConnectionBox: (box: ModuleConnectionBox) => new ModuleConnectionAdapter(this.#context, box),
            visitModuleDelayBox: (box: ModuleDelayBox) => new ModuleDelayAdapter(this.#context, box),
            visitModuleGainBox: (box: ModuleGainBox) => new ModuleGainAdapter(this.#context, box),
            visitModuleMultiplierBox: (box: ModuleMultiplierBox) => new ModuleMultiplierAdapter(this.#context, box),
            visitModularAudioInputBox: (box: ModularAudioInputBox) => new ModularAudioInputAdapter(this.#context, box),
            visitModularAudioOutputBox: (box: ModularAudioOutputBox) => new ModularAudioOutputAdapter(this.#context, box),
            visitDeviceInterfaceKnobBox: (box: DeviceInterfaceKnobBox) => new DeviceInterfaceKnobAdapter(this.#context, box),
            visitAudioUnitBox: (box: AudioUnitBox) => new AudioUnitBoxAdapter(this.#context, box),
            visitAudioBusBox: (box: AudioBusBox): BoxAdapter => new AudioBusBoxAdapter(this.#context, box),
            visitAuxSendBox: (box: AuxSendBox): BoxAdapter => new AuxSendBoxAdapter(this.#context, box),
            visitAudioFileBox: (box: AudioFileBox) => new AudioFileBoxAdapter(this.#context, box),
            visitAudioClipBox: (box: AudioClipBox) => new AudioClipBoxAdapter(this.#context, box),
            visitAudioRegionBox: (box: AudioRegionBox) => new AudioRegionBoxAdapter(this.#context, box),
            visitNoteEventBox: (box: NoteEventBox) => new NoteEventBoxAdapter(this.#context, box),
            visitNoteEventCollectionBox: (box: NoteEventCollectionBox): BoxAdapter => new NoteEventCollectionBoxAdapter(this.#context, box),
            visitNoteClipBox: (box: NoteClipBox) => new NoteClipBoxAdapter(this.#context, box),
            visitNoteRegionBox: (box: NoteRegionBox) => new NoteRegionBoxAdapter(this.#context, box),
            visitValueEventBox: (box: ValueEventBox) => new ValueEventBoxAdapter(this.#context, box),
            visitValueEventCollectionBox: (box: ValueEventCollectionBox): BoxAdapter => new ValueEventCollectionBoxAdapter(this.#context, box),
            visitValueClipBox: (box: ValueClipBox) => new ValueClipBoxAdapter(this.#context, box),
            visitValueRegionBox: (box: ValueRegionBox) => new ValueRegionBoxAdapter(this.#context, box),
            visitTrackBox: (box: TrackBox) => new TrackBoxAdapter(this.#context, box),
            visitTimelineBox: (box: TimelineBox) => new TimelineBoxAdapter(this.#context, box),
            visitMarkerBox: (box: MarkerBox) => new MarkerBoxAdapter(this.#context, box),
            visitZeitgeistDeviceBox: (box: ZeitgeistDeviceBox) => new ZeitgeistDeviceBoxAdapter(this.#context, box),
            visitUnknownMidiEffectDeviceBox: (box: UnknownMidiEffectDeviceBox) => new UnknownMidiEffectDeviceBoxAdapter(this.#context, box),
            visitGrooveShuffleBox: (box: GrooveShuffleBox) => new GrooveShuffleBoxAdapter(this.#context, box)
        }), `Could not find factory for ${unknownBox}`)
    }
}