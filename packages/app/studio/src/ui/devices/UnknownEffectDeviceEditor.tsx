import css from "./UnknownEffectDeviceEditor.sass?inline"
import {
    DeviceHost,
    IconSymbol,
    UnknownAudioEffectDeviceBoxAdapter,
    UnknownMidiEffectDeviceBoxAdapter
} from "@dlm-daw/studio-adapters"
import {Lifecycle} from "@dlm-daw/lib-std"
import {DeviceEditor} from "@/ui/devices/DeviceEditor.tsx"
import {MenuItems} from "@/ui/devices/menu-items.ts"
import {createElement} from "@dlm-daw/lib-jsx"
import {DeviceMidiMeter} from "@/ui/devices/panel/DeviceMidiMeter.tsx"
import {Html} from "@dlm-daw/lib-dom"
import {StudioService} from "@/service/StudioService"

const className = Html.adoptStyleSheet(css, "UnknownAudioEffectDeviceEditor")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    adapter: UnknownMidiEffectDeviceBoxAdapter | UnknownAudioEffectDeviceBoxAdapter
    deviceHost: DeviceHost
}

export const UnknownEffectDeviceEditor = ({lifecycle, service, adapter, deviceHost}: Construct) => {
    const {project} = service
    return (
        <DeviceEditor lifecycle={lifecycle}
                      project={project}
                      adapter={adapter}
                      populateMenu={parent => MenuItems.forEffectDevice(parent, service, deviceHost, adapter)}
                      populateControls={() => (
                          <div className={className}>{adapter.commentField.getValue()}</div>
                      )}
                      populateMeter={() => (
                          <DeviceMidiMeter lifecycle={lifecycle}
                                           receiver={project.liveStreamReceiver}
                                           address={adapter.address}/>
                      )}
                      icon={IconSymbol.Effects}/>
    )
}