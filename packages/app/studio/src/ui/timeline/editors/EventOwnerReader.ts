import {ppqn} from "@dlm-daw/lib-dsp"
import {int, Observer, Option, Subscription} from "@dlm-daw/lib-std"
import {TimeAxisCursorMapper} from "@/ui/timeline/TimeAxis.tsx"
import {
    AudioFileBoxAdapter,
    NoteEventCollectionBoxAdapter,
    TrackBoxAdapter,
    ValueEventCollectionBoxAdapter
} from "@dlm-daw/studio-adapters"
import {TimelineRange} from "@dlm-daw/studio-core"

export interface AudioEventOwnerReader extends EventOwnerReader<never> {
    get file(): AudioFileBoxAdapter
    get gain(): number
}

export interface NoteEventOwnerReader extends EventOwnerReader<NoteEventCollectionBoxAdapter> {}

export interface ValueEventOwnerReader extends EventOwnerReader<ValueEventCollectionBoxAdapter> {}

export interface EventOwnerReader<CONTENT> extends TimeAxisCursorMapper {
    get position(): ppqn
    get duration(): ppqn
    get loopOffset(): ppqn
    get loopDuration(): ppqn
    get contentDuration(): ppqn
    set contentDuration(value: ppqn)
    get offset(): ppqn
    get complete(): ppqn
    get hue(): int
    get hasContent(): boolean
    get isMirrored(): boolean
    get content(): CONTENT
    get trackBoxAdapter(): Option<TrackBoxAdapter>

    subscribeChange(observer: Observer<void>): Subscription
    watchOverlap(range: TimelineRange): Subscription
}