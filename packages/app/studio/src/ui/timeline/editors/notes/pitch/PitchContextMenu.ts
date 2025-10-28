import {ContextMenu} from "@/ui/ContextMenu.ts"
import {ElementCapturing} from "@/ui/canvas/capturing.ts"
import {Editing} from "@dlm-daw/lib-box"
import {MutableObservableValue, Selection} from "@dlm-daw/lib-std"
import {NoteEventBoxAdapter} from "@dlm-daw/studio-adapters"
import {PitchCaptureTarget} from "@/ui/timeline/editors/notes/pitch/PitchEventCapturing.ts"
import {createPitchMenu} from "@/ui/timeline/editors/notes/pitch/PitchMenu.ts"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {EventCollection} from "@dlm-daw/lib-dsp"

type Construct = {
    element: Element
    capturing: ElementCapturing<PitchCaptureTarget>
    snapping: Snapping
    editing: Editing
    selection: Selection<NoteEventBoxAdapter>
    events: EventCollection<NoteEventBoxAdapter>
    stepRecording: MutableObservableValue<boolean>
}

export const installContextMenu =
    ({element, capturing, snapping, editing, selection, events, stepRecording}: Construct) =>
        ContextMenu.subscribe(element, (collector: ContextMenu.Collector) => {
            const target = capturing.captureEvent(collector.client)
            if (target === null) {return}
            if ("event" in target && !selection.isSelected(target.event)) {
                selection.deselectAll()
                selection.select(target.event)
            }
            createPitchMenu({editing, snapping, selection, events, stepRecording})(collector)
        })