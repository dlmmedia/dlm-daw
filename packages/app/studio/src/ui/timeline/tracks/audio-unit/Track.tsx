import css from "./Track.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {Html} from "@dlm-daw/lib-dom"
import {StudioService} from "@/service/StudioService.ts"
import {createElement} from "@dlm-daw/lib-jsx"
import {TrackHeader} from "@/ui/timeline/tracks/audio-unit/TrackHeader.tsx"
import {AudioUnitBoxAdapter, TrackBoxAdapter} from "@dlm-daw/studio-adapters"
import {ClipLane} from "@/ui/timeline/tracks/audio-unit/clips/ClipLane.tsx"
import {RegionLane} from "@/ui/timeline/tracks/audio-unit/regions/RegionLane.tsx"
import {TracksManager} from "@/ui/timeline/tracks/audio-unit/TracksManager.ts"

const className = Html.adoptStyleSheet(css, "Track")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    trackManager: TracksManager
    audioUnitBoxAdapter: AudioUnitBoxAdapter
    trackBoxAdapter: TrackBoxAdapter
}

export const Track = ({lifecycle, service, trackManager, audioUnitBoxAdapter, trackBoxAdapter}: Construct) => {
    const element: HTMLElement = (
        <div className={className}>
            <TrackHeader lifecycle={lifecycle}
                         service={service}
                         audioUnitBoxAdapter={audioUnitBoxAdapter}
                         trackBoxAdapter={trackBoxAdapter}/>
            <ClipLane lifecycle={lifecycle}
                      service={service}
                      adapter={trackBoxAdapter}
                      trackManager={trackManager}/>
            <RegionLane lifecycle={lifecycle}
                        adapter={trackBoxAdapter}
                        trackManager={trackManager}
                        range={service.timeline.range}/>
        </div>
    )
    lifecycle.own(trackBoxAdapter.indexField
        .catchupAndSubscribe(owner => element.style.gridRow = String(owner.getValue() + 1)))
    return element
}