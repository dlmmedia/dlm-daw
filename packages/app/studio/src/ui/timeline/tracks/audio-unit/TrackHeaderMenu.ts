import {MenuItem} from "@/ui/model/menu-item"
import {isInstanceOf, Procedure, UUID} from "@dlm-daw/lib-std"
import {AudioUnitBoxAdapter, DeviceAccepts, TrackBoxAdapter, TrackType} from "@dlm-daw/studio-adapters"
import {DebugMenus} from "@/ui/menu/debug"
import {MidiImport} from "@/ui/timeline/MidiImport.ts"
import {CaptureMidiBox, TrackBox} from "@dlm-daw/studio-boxes"
import {StudioService} from "@/service/StudioService"
import {MenuCapture} from "@/ui/timeline/tracks/audio-unit/menu/capture"
import {Browser} from "@dlm-daw/lib-dom"

export const installTrackHeaderMenu = (service: StudioService,
                                       audioUnitBoxAdapter: AudioUnitBoxAdapter,
                                       trackBoxAdapter: TrackBoxAdapter): Procedure<MenuItem> => parent => {
    const inputAdapter = audioUnitBoxAdapter.input.getValue()
    if (inputAdapter.isEmpty()) {return parent}
    const accepts: DeviceAccepts = inputAdapter.unwrap("Cannot unwrap input adapter").accepts
    const acceptMidi = audioUnitBoxAdapter.captureBox.mapOr(box => isInstanceOf(box, CaptureMidiBox), false)
    const trackType = DeviceAccepts.toTrackType(accepts)
    const {project} = service
    const {captureDevices, editing, selection} = project
    return parent.addMenuItem(
        MenuItem.default({label: "Test Extract", hidden: !Browser.isLocalHost()}) // TODO Remove when tested
            .setTriggerProcedure(() => editing.modify(async () => {
                const newProject = await project.api.extractIntoNew([trackBoxAdapter.audioUnit])
                service.fromProject(newProject, "NEW")
            })),
        MenuItem.default({label: "Enabled", checked: trackBoxAdapter.enabled.getValue()})
            .setTriggerProcedure(() => editing.modify(() => trackBoxAdapter.enabled.toggle())),
        MenuItem.default({
            label: `New ${TrackType.toLabelString(trackType)} Track`,
            hidden: trackBoxAdapter.type === TrackType.Undefined
        }).setTriggerProcedure(() => editing.modify(() => {
            TrackBox.create(project.boxGraph, UUID.generate(), box => {
                box.type.setValue(trackType)
                box.tracks.refer(audioUnitBoxAdapter.box.tracks)
                box.index.setValue(audioUnitBoxAdapter.tracks.values().length)
                box.target.refer(audioUnitBoxAdapter.box)
            })
        })),
        MenuCapture.createItem(audioUnitBoxAdapter, trackBoxAdapter, editing, captureDevices.get(audioUnitBoxAdapter.uuid)),
        MenuItem.default({label: "Move", separatorBefore: true})
            .setRuntimeChildrenProcedure(parent => parent.addMenuItem(
                MenuItem.default({label: "Track 1 Up", selectable: trackBoxAdapter.indexField.getValue() > 0})
                    .setTriggerProcedure(() => editing.modify(() => audioUnitBoxAdapter.moveTrack(trackBoxAdapter, -1))),
                MenuItem.default({
                    label: "Track 1 Down",
                    selectable: trackBoxAdapter.indexField.getValue() < audioUnitBoxAdapter.tracks.collection.size() - 1
                }).setTriggerProcedure(() => editing.modify(() => audioUnitBoxAdapter.moveTrack(trackBoxAdapter, 1))),
                MenuItem.default({
                    label: "AudioUnit 1 Up",
                    selectable: audioUnitBoxAdapter.indexField.getValue() > 0 && false
                }).setTriggerProcedure(() => editing.modify(() => audioUnitBoxAdapter.move(-1))),
                MenuItem.default({
                    label: "AudioUnit 1 Down",
                    selectable: audioUnitBoxAdapter.indexField.getValue() < project.rootBoxAdapter.audioUnits.adapters()
                        .filter(adapter => !adapter.isOutput).length - 1 && false
                }).setTriggerProcedure(() => editing.modify(() => audioUnitBoxAdapter.move(1)))
            )),
        MenuItem.default({label: "Select Clips", selectable: !trackBoxAdapter.clips.collection.isEmpty()})
            .setTriggerProcedure(() => trackBoxAdapter.clips.collection.adapters()
                .forEach(clip => selection.select(clip.box))),
        MenuItem.default({label: "Select Regions", selectable: !trackBoxAdapter.regions.collection.isEmpty()})
            .setTriggerProcedure(() => trackBoxAdapter.regions.collection.asArray()
                .forEach(region => selection.select(region.box))),
        MenuItem.default({
            label: "Import Midi...",
            hidden: !acceptMidi,
            separatorBefore: true
        }).setTriggerProcedure(() => MidiImport.toTracks(project, audioUnitBoxAdapter)),
        MenuItem.default({
            label: "Delete Track",
            selectable: !audioUnitBoxAdapter.isOutput,
            separatorBefore: true
        }).setTriggerProcedure(() => editing.modify(() => {
            if (audioUnitBoxAdapter.tracks.collection.size() === 1) {
                project.api.deleteAudioUnit(audioUnitBoxAdapter.box)
            } else {
                audioUnitBoxAdapter.deleteTrack(trackBoxAdapter)
            }
        })),
        MenuItem.default({
            label: `Delete '${audioUnitBoxAdapter.input.label.unwrapOrElse("No Input")}'`,
            selectable: !audioUnitBoxAdapter.isOutput
        }).setTriggerProcedure(() => editing.modify(() =>
            project.api.deleteAudioUnit(audioUnitBoxAdapter.box))),
        DebugMenus.debugBox(audioUnitBoxAdapter.box)
    )
}