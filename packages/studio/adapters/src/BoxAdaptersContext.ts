import {Terminable} from "@dlm-daw/lib-std"
import {BoxGraph} from "@dlm-daw/lib-box"
import {LiveStreamBroadcaster, LiveStreamReceiver} from "@dlm-daw/lib-fusion"
import {RootBoxAdapter} from "./RootBoxAdapter"
import {TimelineBoxAdapter} from "./timeline/TimelineBoxAdapter"
import {ClipSequencing} from "./ClipSequencing"
import {ParameterFieldAdapters} from "./ParameterFieldAdapters"
import {BoxAdapters} from "./BoxAdapters"
import {SampleLoaderManager} from "./sample/SampleLoaderManager"

export interface BoxAdaptersContext extends Terminable {
    get boxGraph(): BoxGraph
    get boxAdapters(): BoxAdapters
    get sampleManager(): SampleLoaderManager
    get rootBoxAdapter(): RootBoxAdapter
    get timelineBoxAdapter(): TimelineBoxAdapter
    get liveStreamReceiver(): LiveStreamReceiver
    get liveStreamBroadcaster(): LiveStreamBroadcaster
    get clipSequencing(): ClipSequencing
    get parameterFieldAdapters(): ParameterFieldAdapters
    get bpm(): number // TODO This is a shortcut for now
    get isMainThread(): boolean
    get isAudioContext(): boolean
}