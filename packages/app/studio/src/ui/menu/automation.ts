import {ContextMenu} from "@/ui/ContextMenu.ts"
import {MenuItem} from "@/ui/model/menu-item.ts"
import {AudioUnitTracks, AutomatableParameterFieldAdapter, TrackType} from "@dlm-daw/studio-adapters"
import {Editing, PrimitiveValues} from "@dlm-daw/lib-box"
import {MIDILearning} from "@dlm-daw/studio-core"

export const attachParameterContextMenu = <T extends PrimitiveValues>(editing: Editing,
                                                                      midiDevices: MIDILearning,
                                                                      tracks: AudioUnitTracks,
                                                                      parameter: AutomatableParameterFieldAdapter<T>,
                                                                      element: Element) =>
    ContextMenu.subscribe(element, collector => {
        const field = parameter.field
        const automation = tracks.controls(field)
        collector.addItems(
            automation.isEmpty()
                ? MenuItem.default({label: "Create Automation"})
                    .setTriggerProcedure(() => editing.modify(() =>
                        tracks.create(TrackType.Value, field)))
                : MenuItem.default({label: "Remove Automation"})
                    .setTriggerProcedure(() => editing.modify(() =>
                        tracks.delete(automation.unwrap()))),
            MenuItem.default({
                label: midiDevices.hasMidiConnection(field.address)
                    ? "Forget Midi"
                    : "Learn Midi Control..."
            }).setTriggerProcedure(() => {
                if (midiDevices.hasMidiConnection(field.address)) {
                    midiDevices.forgetMidiConnection(field.address)
                } else {
                    midiDevices.learnMIDIControls(field).then()
                }
            }),
            MenuItem.default({label: "Reset Value", checked: field.getValue() === field.initValue})
                .setTriggerProcedure(() => editing.modify(() => parameter.reset()))
        )
    })