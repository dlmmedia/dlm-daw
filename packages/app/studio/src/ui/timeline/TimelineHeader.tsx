import css from "./TimelineHeader.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {StudioService} from "@/service/StudioService.ts"
import {SnapSelector} from "@/ui/timeline/SnapSelector.tsx"
import {createElement} from "@dlm-daw/lib-jsx"
import {FlexSpacer} from "@/ui/components/FlexSpacer.tsx"
import {Icon} from "@/ui/components/Icon.tsx"
import {Checkbox} from "@/ui/components/Checkbox.tsx"
import {IconSymbol} from "@dlm-daw/studio-adapters"
import {Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "TimelineHeader")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

export const TimelineHeader = ({lifecycle, service}: Construct) => {
    const {snapping, followPlaybackCursor, primaryVisible, clips} = service.timeline
    return (
        <div className={className}>
            <SnapSelector lifecycle={lifecycle} snapping={snapping}/>
            <FlexSpacer/>
            <hr/>
            <Checkbox lifecycle={lifecycle}
                      model={followPlaybackCursor}
                      appearance={{activeColor: Colors.orange, tooltip: "Follow Playback Cursor"}}>
                <Icon symbol={IconSymbol.Run}/>
            </Checkbox>
            <hr/>
            <Checkbox lifecycle={lifecycle}
                      model={primaryVisible}
                      appearance={{activeColor: Colors.yellow, tooltip: "Markers"}}>
                <Icon symbol={IconSymbol.Primary}/>
            </Checkbox>
            <Checkbox lifecycle={lifecycle}
                      model={clips.visible}
                      appearance={{activeColor: Colors.yellow, tooltip: "Clips"}}>
                <Icon symbol={IconSymbol.Clips}/>
            </Checkbox>
        </div>
    )
}