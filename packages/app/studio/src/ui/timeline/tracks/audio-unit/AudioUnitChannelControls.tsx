import css from "./AudioUnitChannelControls.sass?inline"
import {Arrays, isInstanceOf, Lifecycle, Terminable, Terminator} from "@dlm-daw/lib-std"
import {RelativeUnitValueDragging} from "@/ui/wrapper/RelativeUnitValueDragging.tsx"
import {SnapCenter, SnapCommonDecibel} from "@/ui/configs.ts"
import {Knob} from "@/ui/components/Knob.tsx"
import {Checkbox} from "@/ui/components/Checkbox.tsx"
import {Icon} from "@/ui/components/Icon.tsx"
import {createElement} from "@dlm-daw/lib-jsx"
import {EditWrapper} from "@/ui/wrapper/EditWrapper.ts"
import {AudioUnitBoxAdapter, IconSymbol} from "@dlm-daw/studio-adapters"
import {attachParameterContextMenu} from "@/ui/menu/automation.ts"
import {ControlIndicator} from "@/ui/components/ControlIndicator"
import {Html} from "@dlm-daw/lib-dom"
import {CaptureAudio, Colors} from "@dlm-daw/studio-core"
import {HorizontalPeakMeter} from "@/ui/components/HorizontalPeakMeter"
import {gainToDb} from "@dlm-daw/lib-dsp"
import {StudioService} from "@/service/StudioService"
import {TextTooltip} from "@/ui/surface/TextTooltip"
import {Button} from "@/ui/components/Button"

const className = Html.adoptStyleSheet(css, "AudioUnitChannelControls")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    adapter: AudioUnitBoxAdapter
}

export const AudioUnitChannelControls = ({lifecycle, service, adapter}: Construct) => {
    const {project, audioContext} = service
    const {captureDevices, editing, midiLearning} = project
    const {volume, panning, mute, solo} = adapter.namedParameter
    const volumeControl = (
        <RelativeUnitValueDragging lifecycle={lifecycle}
                                   editing={project.editing}
                                   parameter={volume}
                                   options={SnapCommonDecibel}>
            <ControlIndicator lifecycle={lifecycle} parameter={volume}>
                <Knob lifecycle={lifecycle} value={volume} anchor={0.0} color={Colors.yellow}/>
            </ControlIndicator>
        </RelativeUnitValueDragging>
    )
    const panningControl = (
        <RelativeUnitValueDragging lifecycle={lifecycle}
                                   editing={editing}
                                   parameter={panning}
                                   options={SnapCenter}>
            <ControlIndicator lifecycle={lifecycle} parameter={panning}>
                <Knob lifecycle={lifecycle} value={panning} anchor={0.5} color={Colors.green}/>
            </ControlIndicator>
        </RelativeUnitValueDragging>
    )
    const muteControl = (
        <ControlIndicator lifecycle={lifecycle} parameter={mute}>
            <Checkbox lifecycle={lifecycle}
                      model={EditWrapper.forAutomatableParameter(editing, mute)}
                      appearance={{activeColor: Colors.orange, framed: true}}>
                <Icon symbol={IconSymbol.Mute}/>
            </Checkbox>
        </ControlIndicator>
    )
    const soloControl = (
        <ControlIndicator lifecycle={lifecycle} parameter={solo}>
            <Checkbox lifecycle={lifecycle}
                      model={EditWrapper.forAutomatableParameter(editing, solo)}
                      appearance={{activeColor: Colors.yellow, framed: true}}>
                <Icon symbol={IconSymbol.Solo}/>
            </Checkbox>
        </ControlIndicator>
    )
    const peaksInDb = new Float32Array(Arrays.create(() => Number.NEGATIVE_INFINITY, 2))
    let streamRunning = false
    const captureOption = captureDevices.get(adapter.uuid)
    lifecycle.ownAll(
        attachParameterContextMenu(editing, midiLearning, adapter.tracks, volume, volumeControl),
        attachParameterContextMenu(editing, midiLearning, adapter.tracks, panning, panningControl),
        attachParameterContextMenu(editing, midiLearning, adapter.tracks, mute, muteControl),
        attachParameterContextMenu(editing, midiLearning, adapter.tracks, solo, soloControl),
        captureOption.ifSome(capture => {
            if (!isInstanceOf(capture, CaptureAudio)) {return}
            const streamLifeCycle = lifecycle.own(new Terminator())
            capture.stream.catchupAndSubscribe(optStream => {
                streamRunning = false
                streamLifeCycle.terminate()
                return optStream.ifSome(stream => {
                    const numberOfChannels = stream.getAudioTracks().at(0)?.getSettings().channelCount ?? 2
                    const meterWorklet = service.audioWorklets.createMeter(numberOfChannels)
                    const streamSource = audioContext.createMediaStreamSource(stream)
                    streamSource.connect(meterWorklet)
                    streamRunning = true
                    streamLifeCycle.ownAll(
                        Terminable.create(() => streamSource.disconnect()),
                        meterWorklet.subscribe(({peak}) => {
                            peaksInDb[0] = gainToDb(peak[0])
                            peaksInDb[1] = gainToDb(peak[1] ?? peak[0])
                        }),
                        meterWorklet
                    )
                })
            })
        }) ?? Terminable.Empty,
        project.liveStreamReceiver.subscribeFloats(adapter.address, values => {
            if (streamRunning) {return}
            peaksInDb[0] = gainToDb(values[0])
            peaksInDb[1] = gainToDb(values[1] ?? values[0])
        })
    )
    return (
        <div className={className}>
            <header>
                <div className="channel-mix">
                    {volumeControl}
                    {panningControl}
                </div>
                <div className="channel-isolation">
                    {muteControl}
                    {soloControl}
                </div>
                <div className="channel-capture">
                    {captureOption.ifSome(capture => {
                        const button: HTMLElement = (
                            <Button lifecycle={lifecycle}
                                    onClick={({shiftKey}) => captureDevices.setArm(capture, !shiftKey)}
                                    appearance={{activeColor: Colors.red, framed: true}}>
                                <Icon symbol={IconSymbol.Record}/>
                            </Button>)
                        lifecycle.ownAll(
                            TextTooltip.default(button, () => capture.label),
                            capture.armed.catchupAndSubscribe(owner =>
                                button.classList.toggle("active", owner.getValue()))
                        )
                        return button
                    })}
                </div>
            </header>
            <HorizontalPeakMeter lifecycle={lifecycle} peaksInDb={peaksInDb}/>
        </div>
    )
}