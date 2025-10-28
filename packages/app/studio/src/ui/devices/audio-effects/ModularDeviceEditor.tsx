import css from "./ModularDeviceEditor.sass?inline"
import {createElement} from "@dlm-daw/lib-jsx"
import {DeviceEditor} from "@/ui/devices/DeviceEditor.tsx"
import {assert, Lifecycle, SortedSet, Terminable, Terminator, UUID} from "@dlm-daw/lib-std"
import {MenuItems} from "@/ui/devices/menu-items.ts"
import {DeviceHost, DeviceInterfaceKnobAdapter, ModularDeviceBoxAdapter} from "@dlm-daw/studio-adapters"
import {MenuItem} from "@/ui/model/menu-item.ts"
import {BoxVisitor, DeviceInterfaceKnobBox} from "@dlm-daw/studio-boxes"
import {Box, PointerField} from "@dlm-daw/lib-box"
import {ContextMenu} from "@/ui/ContextMenu.ts"
import {ControlBuilder} from "@/ui/devices/ControlBuilder.tsx"
import {DevicePeakMeter} from "@/ui/devices/panel/DevicePeakMeter.tsx"
import {Html} from "@dlm-daw/lib-dom"
import {StudioService} from "@/service/StudioService"
import {EffectFactories} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "ModularDeviceEditor")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    adapter: ModularDeviceBoxAdapter
    deviceHost: DeviceHost
}

type UserInterfaceElement = {
    uuid: UUID.Bytes
    element: Element
    terminable: Terminable
}

export const ModularDeviceEditor = ({lifecycle, service, adapter, deviceHost}: Construct) => {
    const {project} = service
    const userInterface: HTMLElement = <div className={className}/>
    const elements: SortedSet<UUID.Bytes, UserInterfaceElement> = UUID.newSet(entry => entry.uuid)
    const addElement = (box: Box): void => {
        const success = box.accept<BoxVisitor<true>>({
            visitDeviceInterfaceKnobBox: (box: DeviceInterfaceKnobBox): true => {
                const runtime = new Terminator()
                const {parameterAdapter} = project.boxAdapters.adapterFor(box, DeviceInterfaceKnobAdapter)
                const element: HTMLElement = ControlBuilder.createKnob({
                    lifecycle: lifecycle,
                    editing: project.editing,
                    midiLearning: project.midiLearning,
                    adapter: adapter,
                    parameter: parameterAdapter,
                    anchor: box.anchor.getValue()
                })
                runtime.own(ContextMenu.subscribe(element, collector =>
                    collector.addItems(MenuItem.default({label: "Remove"})
                        .setTriggerProcedure(() => project.editing.modify(() => box.delete())))))
                userInterface.appendChild(element)
                runtime.own({terminate: () => element.remove()})
                elements.add({
                    uuid: box.address.uuid,
                    element,
                    terminable: runtime
                })
                return true
            }
        })
        assert(success === true, `Could not resolve ${box}`)
    }
    const removeElement = (box: Box): void => {
        const sucess = box.accept<BoxVisitor<true>>({
            visitDeviceInterfaceKnobBox: (box: DeviceInterfaceKnobBox): true => {
                elements.removeByKey(box.address.uuid).terminable.terminate()
                return true
            }
        })
        assert(sucess === true, `Could not resolve ${box}`)
    }
    adapter.box.userInterface.elements.pointerHub.incoming().forEach(pointer => addElement(pointer.box))
    lifecycle.own(adapter.box.userInterface.elements.pointerHub.subscribeTransactual({
        onAdd: (pointer: PointerField) => addElement(pointer.box),
        onRemove: (pointer: PointerField) => removeElement(pointer.box)
    }))
    lifecycle.own({terminate: () => elements.forEach(entry => entry.terminable.terminate())})
    return (
        <DeviceEditor lifecycle={lifecycle}
                      project={project}
                      adapter={adapter}
                      populateMenu={parent => {
                          parent.addMenuItem(MenuItem.default({
                              label: "Edit...",
                              selectable: !project.userEditingManager.modularSystem.isEditing(adapter.modular().box.editing) ||
                                  service.layout.screen.getValue() !== "modular"
                          })
                              .setTriggerProcedure(() => {
                                  project.userEditingManager.modularSystem.edit(adapter.modular().box.editing)
                                  service.switchScreen("modular")
                              }))
                          MenuItems.forEffectDevice(parent, service, deviceHost, adapter)
                      }}
                      populateControls={() => userInterface}
                      populateMeter={() => (
                          <DevicePeakMeter lifecycle={lifecycle}
                                           receiver={project.liveStreamReceiver}
                                           address={adapter.address}/>
                      )}
                      icon={EffectFactories.AudioNamed.Modular.defaultIcon}>
        </DeviceEditor>
    )
}