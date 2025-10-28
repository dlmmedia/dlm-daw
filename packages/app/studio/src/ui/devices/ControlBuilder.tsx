import {AutomatableParameterFieldAdapter, DeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {Column} from "@/ui/devices/Column.tsx"
import {createElement} from "@dlm-daw/lib-jsx"
import {LKR} from "@/ui/devices/constants.ts"
import {ParameterLabelKnob} from "@/ui/devices/ParameterLabelKnob.tsx"
import {TerminableOwner, ValueGuide} from "@dlm-daw/lib-std"
import {Editing, PrimitiveValues} from "@dlm-daw/lib-box"
import {Colors, MIDILearning} from "@dlm-daw/studio-core"

type Creation<T extends PrimitiveValues> = {
    lifecycle: TerminableOwner
    editing: Editing
    midiLearning: MIDILearning
    adapter: DeviceBoxAdapter
    parameter: AutomatableParameterFieldAdapter<T>
    options?: ValueGuide.Options
    anchor?: number
    color?: string
}

export namespace ControlBuilder {
    export const createKnob = <T extends PrimitiveValues, >
    ({lifecycle, editing, midiLearning, adapter, parameter, options, anchor, color}: Creation<T>) => {
        return (
            <Column ems={LKR} color={color ?? Colors.cream}>
                <h5>{parameter.name}</h5>
                <ParameterLabelKnob lifecycle={lifecycle}
                                    editing={editing}
                                    midiLearning={midiLearning}
                                    adapter={adapter}
                                    parameter={parameter}
                                    options={options}
                                    anchor={anchor}/>
            </Column>
        )
    }
}