import css from "./ScaleSelector.sass?inline"
import {Arrays, Lifecycle} from "@dlm-daw/lib-std"
import {MenuButton} from "@/ui/components/MenuButton.tsx"
import {createElement, Inject} from "@dlm-daw/lib-jsx"
import {MidiKeys} from "@dlm-daw/lib-dsp"
import {MenuItem} from "@/ui/model/menu-item.ts"
import {ScaleConfig} from "@/ui/timeline/editors/notes/pitch/ScaleConfig.ts"
import {Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "ScaleSelector")

type Construct = {
    lifecycle: Lifecycle
    scale: ScaleConfig
}

export const ScaleSelector = ({lifecycle, scale}: Construct) => {
    const labels = MidiKeys.Names.English
    const labelName = Inject.value(labels[scale.key])
    lifecycle.own(scale.subscribe(() => {labelName.value = labels[scale.key]}))
    return (
        <div className={className}>
            <MenuButton root={MenuItem.root().setRuntimeChildrenProcedure((parent: MenuItem) => {
                parent.addMenuItem(...Arrays.create(key => MenuItem.default({
                    label: labels[key],
                    checked: key === scale.key
                }).setTriggerProcedure(() => scale.key = key), 12))
            })} appearance={{framed: true, color: Colors.dark, activeColor: Colors.gray}}>
                <label style={{padding: "0"}}><span>{labelName}</span></label>
            </MenuButton>
        </div>
    )
}