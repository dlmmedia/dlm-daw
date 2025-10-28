import css from "./TapeDeviceEditor.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {DeviceEditor} from "@/ui/devices/DeviceEditor.tsx"
import {Tape} from "@/ui/devices/instruments/TapeDeviceEditor/Tape.tsx"
import {Timeline} from "@/ui/devices/instruments/TapeDeviceEditor/Timeline.tsx"
import {AudioUnitTracks, DeviceHost, TapeDeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {MenuItems} from "@/ui/devices/menu-items.ts"
import {DevicePeakMeter} from "@/ui/devices/panel/DevicePeakMeter.tsx"
import {Html} from "@dlm-daw/lib-dom"
import {StudioService} from "@/service/StudioService"
import {InstrumentFactories} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "TapeDeviceEditor")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    adapter: TapeDeviceBoxAdapter
    deviceHost: DeviceHost
}

export const TapeDeviceEditor = ({lifecycle, service, adapter, deviceHost}: Construct) => {
    const {project} = service
    const {engine: {position}} = project
    const tracks: AudioUnitTracks = deviceHost.audioUnitBoxAdapter().tracks
    return (
        <DeviceEditor lifecycle={lifecycle}
                      project={project}
                      adapter={adapter}
                      populateMenu={parent => MenuItems.forAudioUnitInput(parent, service, deviceHost)}
                      populateControls={() => (
                          <div className={className}>
                              <div className="controls"/>
                              <div className="content">
                                  <Tape lifecycle={lifecycle} position={position} tracks={tracks}/>
                                  <Timeline lifecycle={lifecycle} position={position} tracks={tracks}/>
                              </div>
                          </div>
                      )}
                      populateMeter={() => (
                          <DevicePeakMeter lifecycle={lifecycle}
                                           receiver={project.liveStreamReceiver}
                                           address={adapter.address}/>
                      )}
                      icon={InstrumentFactories.Tape.defaultIcon}/>
    )
}