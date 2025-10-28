import {Lifecycle, unitValue} from "@dlm-daw/lib-std"
import {Knob} from "@/ui/components/Knob.tsx"
import {ParameterLabel} from "@/ui/components/ParameterLabel.tsx"
import {createElement} from "@dlm-daw/lib-jsx"
import {AutomatableParameterFieldAdapter, DeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {Editing} from "@dlm-daw/lib-box"
import {MIDILearning} from "@dlm-daw/studio-core"

type Construct = {
    lifecycle: Lifecycle
    editing: Editing
    midiDevices: MIDILearning,
    adapter: DeviceBoxAdapter
    parameter: AutomatableParameterFieldAdapter
    anchor: unitValue
}

export const LabelKnob = ({lifecycle, editing, midiDevices, adapter, parameter, anchor}: Construct) => {
    return (
        <div style={{display: "contents"}}>
            <Knob lifecycle={lifecycle} value={parameter} anchor={anchor}/>
            <ParameterLabel lifecycle={lifecycle}
                            editing={editing}
                            midiLearning={midiDevices}
                            adapter={adapter}
                            parameter={parameter}/>
        </div>
    )
}