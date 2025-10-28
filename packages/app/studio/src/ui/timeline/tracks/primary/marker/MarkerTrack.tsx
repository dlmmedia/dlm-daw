import css from "./MarkerTrack.sass?inline"
import {Lifecycle, ObservableValue} from "@dlm-daw/lib-std"
import {createElement, Inject} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {MarkerTrackBody} from "@/ui/timeline/tracks/primary/marker/MarkerTrackBody.tsx"
import {MarkerTrackHeader} from "@/ui/timeline/tracks/primary/marker/MarkerTrackHeader.tsx"
import {Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "MarkerTrack")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

export const MarkerTrack = ({lifecycle, service}: Construct) => {
    const classList = Inject.classList(className)
    const visibleObserver = (owner: ObservableValue<boolean>) => classList.toggle("hidden", !owner.getValue())
    const {primaryVisible} = service.timeline
    lifecycle.own(primaryVisible.subscribe(visibleObserver))
    visibleObserver(primaryVisible)
    return (
        <div className={classList}>
            <MarkerTrackHeader/>
            <div className="void"/>
            <MarkerTrackBody lifecycle={lifecycle} service={service}/>
        </div>
    )
}