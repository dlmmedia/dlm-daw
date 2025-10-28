import css from "./ClipPlaybackButton.sass?inline"
import {DefaultObservableValue, Lifecycle} from "@dlm-daw/lib-std"
import {Html} from "@dlm-daw/lib-dom"
import {createElement} from "@dlm-daw/lib-jsx"
import {AnyClipBoxAdapter, IconSymbol} from "@dlm-daw/studio-adapters"
import {Colors, Engine} from "@dlm-daw/studio-core"
import {IconCartridge} from "@/ui/components/Icon"
import {ClipState} from "./Clip"

const className = Html.adoptStyleSheet(css, "ClipPlaybackButton")

type Construct = {
    lifecycle: Lifecycle
    engine: Engine
    adapter: AnyClipBoxAdapter
    state: DefaultObservableValue<ClipState>
}

export const ClipPlaybackButton = ({lifecycle, engine, adapter, state}: Construct) => {
    const iconModel = new DefaultObservableValue(IconSymbol.Play)
    const element: HTMLElement = (
        <div className={className}
             ondblclick={event => event.stopPropagation()}
             onclick={() => {
                 if (state.getValue() !== ClipState.Idle) {
                     engine.scheduleClipStop([adapter.trackBoxAdapter.unwrap().uuid])
                 } else if (!adapter.box.mute.getValue()) {
                     engine.scheduleClipPlay([adapter.uuid])
                 }
             }}>
            <IconCartridge lifecycle={lifecycle}
                           symbol={iconModel}
                           style={{color: Colors.gray}}/>
        </div>
    )
    lifecycle.own(state.catchupAndSubscribe(owner => {
        switch (owner.getValue()) {
            case ClipState.Idle:
                iconModel.setValue(IconSymbol.Play)
                break
            case ClipState.Waiting:
                break
            case ClipState.Playing:
                iconModel.setValue(IconSymbol.Stop)
                break
        }
    }))
    return element
}