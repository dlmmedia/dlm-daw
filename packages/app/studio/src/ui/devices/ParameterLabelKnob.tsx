import css from "./ParameterLabelKnob.sass?inline"
import {Lifecycle, unitValue, ValueGuide} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {RelativeUnitValueDragging} from "@/ui/wrapper/RelativeUnitValueDragging.tsx"
import {LabelKnob} from "@/ui/composite/LabelKnob.tsx"
import {AutomatableParameterFieldAdapter, DeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {Editing} from "@dlm-daw/lib-box"
import {attachParameterContextMenu} from "@/ui/menu/automation.ts"
import {Html} from "@dlm-daw/lib-dom"
import {MIDILearning} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "ParameterLabelKnob")

type Construct = {
    lifecycle: Lifecycle
    editing: Editing
    midiLearning: MIDILearning
    adapter: DeviceBoxAdapter
    parameter: AutomatableParameterFieldAdapter
    options?: ValueGuide.Options
    anchor?: unitValue
}

export const ParameterLabelKnob = ({
                                       lifecycle,
                                       editing,
                                       midiLearning,
                                       adapter,
                                       parameter,
                                       options,
                                       anchor
                                   }: Construct) => {
    const element: HTMLElement = (
        <div className={className}>
            <RelativeUnitValueDragging lifecycle={lifecycle}
                                       editing={editing}
                                       parameter={parameter}
                                       options={options}>
                <LabelKnob lifecycle={lifecycle}
                           editing={editing}
                           midiDevices={midiLearning}
                           adapter={adapter}
                           parameter={parameter}
                           anchor={anchor ?? 0.0}/>
            </RelativeUnitValueDragging>
        </div>
    )
    lifecycle.own(
        attachParameterContextMenu(editing, midiLearning,
            adapter.deviceHost().audioUnitBoxAdapter().tracks, parameter, element))
    return element
}