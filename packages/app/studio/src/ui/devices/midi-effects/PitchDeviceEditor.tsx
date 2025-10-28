import css from "./PitchDeviceEditor.sass?inline"
import {DeviceHost, PitchDeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {Lifecycle} from "@dlm-daw/lib-std"
import {DeviceEditor} from "@/ui/devices/DeviceEditor.tsx"
import {MenuItems} from "@/ui/devices/menu-items.ts"
import {createElement} from "@dlm-daw/lib-jsx"
import {ControlBuilder} from "@/ui/devices/ControlBuilder.tsx"
import {DeviceMidiMeter} from "@/ui/devices/panel/DeviceMidiMeter.tsx"
import {Html} from "@dlm-daw/lib-dom"
import {StudioService} from "@/service/StudioService"
import {EffectFactories} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "PitchDeviceEditor")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    adapter: PitchDeviceBoxAdapter
    deviceHost: DeviceHost
}

export const PitchDeviceEditor = ({lifecycle, service, adapter, deviceHost}: Construct) => {
    const {octaves, semiTones, cent} = adapter.namedParameter
    const {project} = service
    const {editing, liveStreamReceiver, midiLearning} = project
    return (
        <DeviceEditor lifecycle={lifecycle}
                      project={project}
                      adapter={adapter}
                      populateMenu={parent => MenuItems.forEffectDevice(parent, service, deviceHost, adapter)}
                      populateControls={() => (
                          <div className={className}>
                              {ControlBuilder.createKnob({
                                  lifecycle,
                                  editing,
                                  midiLearning,
                                  adapter,
                                  parameter: octaves
                              })}
                              {ControlBuilder.createKnob({
                                  lifecycle,
                                  editing,
                                  midiLearning,
                                  adapter,
                                  parameter: semiTones
                              })}
                              {ControlBuilder.createKnob({
                                  lifecycle,
                                  editing,
                                  midiLearning,
                                  adapter,
                                  parameter: cent
                              })}
                          </div>
                      )}
                      populateMeter={() => (
                          <DeviceMidiMeter lifecycle={lifecycle}
                                           receiver={liveStreamReceiver}
                                           address={adapter.address}/>
                      )}
                      icon={EffectFactories.MidiNamed.Pitch.defaultIcon}/>
    )
}