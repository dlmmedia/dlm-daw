import {ppqn} from "@dlm-daw/lib-dsp"
import {int, Nullable, ObservableValue, Observer, Subscription, Terminable, UUID} from "@dlm-daw/lib-std"
import {ClipNotification, NoteSignal} from "@dlm-daw/studio-adapters"
import {Project} from "./project/Project"

export interface Engine extends Terminable {
    play(): void
    stop(): void
    setPosition(position: ppqn): void
    startRecording(countIn: boolean): void
    stopRecording(): void
    isReady(): Promise<void>
    queryLoadingComplete(): Promise<boolean>
    stop(): void
    panic(): void
    noteSignal(signal: NoteSignal): void
    subscribeNotes(observer: Observer<NoteSignal>): Subscription
    ignoreNoteRegion(uuid: UUID.Bytes): void
    scheduleClipPlay(clipIds: ReadonlyArray<UUID.Bytes>): void
    scheduleClipStop(trackIds: ReadonlyArray<UUID.Bytes>): void
    subscribeClipNotification(observer: Observer<ClipNotification>): Subscription

    get position(): ObservableValue<ppqn>
    get isPlaying(): ObservableValue<boolean>
    get isRecording(): ObservableValue<boolean>
    get isCountingIn(): ObservableValue<boolean>
    get metronomeEnabled(): ObservableValue<boolean>
    get playbackTimestamp(): ObservableValue<ppqn>
    get countInBeatsTotal(): ObservableValue<int>
    get countInBeatsRemaining(): ObservableValue<number>
    get markerState(): ObservableValue<Nullable<[UUID.Bytes, int]>>
    get project(): Project
}