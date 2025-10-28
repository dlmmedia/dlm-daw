import css from "./OutputSelector.sass?inline"
import {assert, DefaultObservableValue, Lifecycle, StringComparator, UUID} from "@dlm-daw/lib-std"
import {AudioUnitBoxAdapter, IconSymbol} from "@dlm-daw/studio-adapters"
import {createElement, DomElement, Frag} from "@dlm-daw/lib-jsx"
import {IconCartridge} from "@/ui/components/Icon.tsx"
import {Html} from "@dlm-daw/lib-dom"
import {MenuItem} from "@/ui/model/menu-item"
import {showNewAudioBusOrAuxDialog} from "@/ui/dialogs"
import {AudioUnitType} from "@dlm-daw/studio-enums"
import {MenuButton} from "@/ui/components/MenuButton"
import {Colors, Project} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "OutputSelector")

type Construct = {
    lifecycle: Lifecycle
    project: Project
    adapter: AudioUnitBoxAdapter
}

export const ChannelOutputSelector = ({lifecycle, project, adapter}: Construct) => {
    const label: HTMLElement = (<div className="label"/>)
    const symbol = lifecycle.own(new DefaultObservableValue(IconSymbol.NoAudio))
    const iconCartridge: DomElement = (
        <IconCartridge lifecycle={lifecycle} symbol={symbol} style={{fontSize: "1.25em", color: Colors.red}}/>
    )
    lifecycle.own(adapter.output.catchupAndSubscribe(adapter => {
        adapter.match({
            none: () => {
                label.textContent = "No Output"
                iconCartridge.style.color = Colors.red
                symbol.setValue(IconSymbol.NoAudio)
            },
            some: (adapter) => {
                const color = adapter.colorField.getValue()
                label.textContent = adapter.labelField.getValue()
                label.style.color = color
                iconCartridge.style.color = color
                symbol.setValue(IconSymbol.fromName(adapter.iconField.getValue()))
            }
        })
    }))
    return (
        <div className={className}>
            <MenuButton
                root={MenuItem.root()
                    .setRuntimeChildrenProcedure(parent => {
                        const inputUUID = adapter.input.getValue().unwrapOrNull()?.uuid ?? UUID.Lowest
                        const outputUUID = adapter.output.adapter.unwrapOrNull()?.uuid ?? UUID.Lowest
                        parent
                            .addMenuItem(...project.rootBoxAdapter.audioBusses.adapters()
                                .toSorted((a, b) => StringComparator(a.labelField.getValue(), b.labelField.getValue()))
                                .map(bus => MenuItem.default({
                                    label: bus.labelField.getValue(),
                                    icon: bus.deviceHost().audioUnitBoxAdapter().input.icon,
                                    selectable: UUID.Comparator(bus.uuid, inputUUID) !== 0,
                                    checked: UUID.Comparator(bus.uuid, outputUUID) === 0
                                }).setTriggerProcedure(() =>
                                    project.editing.modify(() => adapter.box.output.refer(bus.box.input)))))
                            .addMenuItem(
                                MenuItem.default({
                                    label: "New Output Bus...",
                                    icon: IconSymbol.New,
                                    separatorBefore: true
                                }).setTriggerProcedure(() => showNewAudioBusOrAuxDialog("Bus", ({name, icon}) => {
                                    project.boxGraph.verifyPointers()
                                    project.editing.modify(() => {
                                        assert(project.masterBusBox.isAttached(), "master not attached")
                                        const audioBusBox = project.api.createAudioBus(name, icon, AudioUnitType.Bus, Colors.orange)
                                        adapter.box.output.refer(audioBusBox.input)
                                    })
                                }, IconSymbol.AudioBus)),
                                MenuItem.default({
                                    label: "No Output",
                                    selectable: adapter.box.output.nonEmpty()
                                }).setTriggerProcedure(() => project.editing.modify(() => adapter.box.output.defer()))
                            )
                    })}
                appearance={{color: Colors.dark}}
                stretch={true}>
                <Frag>
                    {label}
                    {iconCartridge}
                </Frag>
            </MenuButton>
        </div>
    )
}