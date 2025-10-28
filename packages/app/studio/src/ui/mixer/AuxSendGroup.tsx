import css from "./AuxSendGroup.sass?inline"
import {Lifecycle, SortedSet, StringComparator, Terminator, UUID} from "@dlm-daw/lib-std"
import {AudioUnitBoxAdapter, AuxSendBoxAdapter, IconSymbol} from "@dlm-daw/studio-adapters"
import {AuxSend} from "@/ui/mixer/AuxSend.tsx"
import {createElement} from "@dlm-daw/lib-jsx"
import {MenuItem} from "@/ui/model/menu-item.ts"
import {AuxSendBox} from "@dlm-daw/studio-boxes"
import {MenuButton} from "@/ui/components/MenuButton.tsx"
import {Icon} from "../components/Icon"
import {showNewAudioBusOrAuxDialog} from "@/ui/dialogs.tsx"
import {AudioUnitType} from "@dlm-daw/studio-enums"
import {Html} from "@dlm-daw/lib-dom"
import {Colors, Project} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "AuxSendGroup")

type AuxSendEntry = {
    uuid: UUID.Bytes
    element: HTMLElement
    terminator: Terminator
}

type Construct = {
    lifecycle: Lifecycle
    project: Project
    audioUnitAdapter: AudioUnitBoxAdapter
}

export const AuxSendGroup = ({lifecycle, project, audioUnitAdapter}: Construct) => {
    const canHaveAuxSends = !audioUnitAdapter.isOutput
    const groupElement: HTMLDivElement = <div className={className}/>
    if (!canHaveAuxSends) {
        return groupElement
    }
    groupElement.classList.add("enabled")
    groupElement.appendChild(
        <MenuButton root={MenuItem.root().setRuntimeChildrenProcedure(parent => {
            const currentAuxSends = audioUnitAdapter.auxSends.adapters()
            const availableSends = project.rootBoxAdapter.audioBusses.adapters()
                .toSorted((a, b) => StringComparator(a.labelField.getValue(), b.labelField.getValue()))
                .filter(auxSendAdapter => !auxSendAdapter.deviceHost().audioUnitBoxAdapter().isOutput)
                .map(auxSendAdapter => MenuItem.default({
                    label: auxSendAdapter.labelField.getValue(),
                    icon: auxSendAdapter.deviceHost().audioUnitBoxAdapter().input.icon,
                    selectable: !currentAuxSends.some(send => send.targetBus.box.address.equals(auxSendAdapter.address))
                }).setTriggerProcedure(() => project.editing.modify(() => {
                    AuxSendBox.create(project.boxGraph, UUID.generate(), box => {
                        box.audioUnit.refer(audioUnitAdapter.box.auxSends)
                        box.routing.setValue(0)
                        box.sendGain.setValue(-6.0)
                        box.targetBus.refer(auxSendAdapter.box.input)
                        box.index.setValue(currentAuxSends.length)
                    })
                }, true)))
            parent
                .addMenuItem(...availableSends)
                .addMenuItem(MenuItem.default({
                    label: "New FX Bus...",
                    icon: IconSymbol.New,
                    separatorBefore: availableSends.length > 0
                })
                    .setTriggerProcedure(() => showNewAudioBusOrAuxDialog("FX", ({name, icon}) => {
                        const currentAuxSends = audioUnitAdapter.auxSends.adapters()
                        project.editing.modify(() => {
                            const audioBusBox = project.api.createAudioBus(name, icon, AudioUnitType.Aux, Colors.green)
                            AuxSendBox.create(project.boxGraph, UUID.generate(), box => {
                                box.audioUnit.refer(audioUnitAdapter.box.auxSends)
                                box.targetBus.refer(audioBusBox.input)
                                box.routing.setValue(0)
                                box.sendGain.setValue(-6.0)
                                box.index.setValue(currentAuxSends.length)
                            })
                        })
                    }, IconSymbol.Effects)))
        })} style={{
            position: "absolute",
            bottom: "0.25em",
            left: "50%",
            transform: "translate(-50%, 0)",
            fontSize: "0.66em"
        }} appearance={{color: Colors.shadow}} pointer>
            <Icon symbol={IconSymbol.Add}/>
        </MenuButton>
    )
    const entries: SortedSet<UUID.Bytes, AuxSendEntry> = UUID.newSet(entry => entry.uuid)
    lifecycle.own(audioUnitAdapter.auxSends.catchupAndSubscribe({
        onAdd: (adapter: AuxSendBoxAdapter) => {
            const terminator = lifecycle.spawn()
            const element: HTMLElement = <AuxSend lifecycle={terminator}
                                                  editing={project.editing}
                                                  adapter={adapter}/>
            groupElement.appendChild(element)
            entries.add({element, terminator, uuid: adapter.uuid})
        },
        onRemove: (adapter: AuxSendBoxAdapter) => {
            const {element, terminator} = entries.removeByKey(adapter.uuid)
            element.remove()
            terminator.terminate()
        },
        onReorder: (_adapter: AuxSendBoxAdapter) => {}
    }))
    return groupElement
}