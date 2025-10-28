import css from "./PitchEditor.sass?inline"
import {Lifecycle, MutableObservableValue, Nullable, Option, panic, Selection, UUID} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {CaptureMidi, TimelineRange} from "@dlm-daw/studio-core"
import {PitchPositioner} from "./PitchPositioner.ts"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {Scroller} from "@/ui/components/Scroller.tsx"
import {createNotePitchPainter} from "@/ui/timeline/editors/notes/pitch/PitchPainter.ts"
import {installCursor} from "@/ui/hooks/cursor.ts"
import {SelectionRectangle} from "@/ui/timeline/SelectionRectangle.tsx"
import {installAutoScroll} from "@/ui/AutoScroll.ts"
import {ScaleConfig} from "@/ui/timeline/editors/notes/pitch/ScaleConfig.ts"
import {BoxAdapters, NoteEventBoxAdapter} from "@dlm-daw/studio-adapters"
import {ObservableModifyContext} from "@/ui/timeline/ObservableModifyContext.ts"
import {NoteContentDurationModifier} from "@/ui/timeline/editors/notes/NoteContentDurationModifier.ts"
import {Cursor} from "@/ui/Cursors.ts"
import {createPitchEventCapturing, PitchCaptureTarget} from "@/ui/timeline/editors/notes/pitch/PitchEventCapturing.ts"
import {NoteModifier} from "@/ui/timeline/editors/notes/NoteModifier.ts"
import {createPitchSelectionLocator} from "@/ui/timeline/editors/notes/pitch/PitchSelectionLocator.ts"
import {attachShortcuts} from "@/ui/timeline/editors/Shortcuts.ts"
import {Config} from "@/ui/timeline/Config.ts"
import {NoteMoveModifier} from "@/ui/timeline/editors/notes/NoteMoveModifier.ts"
import {NoteDurationModifier} from "@/ui/timeline/editors/notes/NoteDurationModifier.ts"
import {installContextMenu} from "@/ui/timeline/editors/notes/pitch/PitchContextMenu.ts"
import {NoteEventBox} from "@dlm-daw/studio-boxes"
import {NoteCreateModifier} from "@/ui/timeline/editors/notes/NoteCreateModifier.ts"
import {CanvasPainter} from "@/ui/canvas/painter.ts"
import {BoxGraph, Editing} from "@dlm-daw/lib-box"
import {NoteEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader.ts"
import {CssUtils, Dragging, Events, Html, Keyboard} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "PitchEditor")

const CursorMap = {
    "note-end": "e-resize",
    "note-position": "default",
    "loop-duration": "ew-resize"
} satisfies Record<PitchCaptureTarget["type"], CssUtils.Cursor>

type Construct = {
    lifecycle: Lifecycle
    graph: BoxGraph
    boxAdapters: BoxAdapters
    range: TimelineRange
    editing: Editing
    snapping: Snapping
    positioner: PitchPositioner
    scale: ScaleConfig
    selection: Selection<NoteEventBoxAdapter>
    modifyContext: ObservableModifyContext<NoteModifier>
    reader: NoteEventOwnerReader
    stepRecording: MutableObservableValue<boolean>
    capture: CaptureMidi
}

export const PitchEditor = ({
                                lifecycle, graph, boxAdapters, range, editing, snapping,
                                positioner, scale, selection, modifyContext, reader, stepRecording
                            }: Construct) => {
    const canvas: HTMLCanvasElement = <canvas tabIndex={-1}/>
    const capturing = createPitchEventCapturing(canvas, positioner, range, reader)
    const locator = createPitchSelectionLocator(reader, range, positioner.valueAxis, capturing)
    const renderer = lifecycle.own(new CanvasPainter(canvas, createNotePitchPainter(
        {canvas, modifyContext, positioner, scale, range, snapping, reader})))
    // before selection
    lifecycle.ownAll(installAutoScroll(canvas, (_deltaX, deltaY) => {
            if (deltaY !== 0) {positioner.moveBy(deltaY * 0.05)}
        }, {padding: Config.AutoScrollPadding}),
        Dragging.attach(canvas, event => {
            const target = capturing.captureEvent(event)
            if (target?.type !== "loop-duration") {return Option.None}
            const clientRect = canvas.getBoundingClientRect()
            return modifyContext.startModifier(NoteContentDurationModifier.create({
                element: canvas,
                pointerPulse: range.xToUnit(event.clientX - clientRect.left),
                snapping,
                reference: target.reader
            }))
        }, {permanentUpdates: true}),
        Dragging.attach(canvas, event => {
            if (!Keyboard.isControlKey(event)) {return Option.None}
            const target = capturing.captureEvent(event)
            if (target !== null) {return Option.None}
            const clientRect = canvas.getBoundingClientRect()
            return modifyContext.startModifier(NoteCreateModifier.create({
                element: canvas,
                pointerPulse: range.xToUnit(event.clientX - clientRect.left) - reader.offset,
                pointerPitch: positioner.yToPitch(event.clientY - clientRect.top),
                selection,
                snapping,
                reference: reader
            }))
        }, {permanentUpdates: true}))
    const selectionRectangle = (
        <SelectionRectangle lifecycle={lifecycle}
                            target={canvas}
                            editing={editing}
                            selection={selection}
                            locator={locator}
                            xAxis={range.valueAxis}
                            yAxis={positioner.valueAxis}/>
    )
    lifecycle.ownAll(
        attachShortcuts(canvas, editing, selection, locator),
        Html.watchResize(canvas, () => range.width = canvas.clientWidth),
        Events.subscribe(canvas, "wheel", (event: WheelEvent) => {
            event.preventDefault()
            positioner.scrollModel.moveBy(event.deltaY)
        }, {passive: false}),
        Events.subscribeDblDwn(canvas, event => {
            const target = capturing.captureEvent(event)
            if (target === null) {
                const rect = canvas.getBoundingClientRect()
                const clientX = event.clientX - rect.left
                const clientY = event.clientY - rect.top
                const pulse = snapping.floor(range.xToUnit(clientX)) - reader.offset
                const pitch = positioner.yToPitch(clientY)
                const boxOpt = editing.modify(() =>
                    NoteEventBox.create(graph, UUID.generate(), box => {
                        box.position.setValue(pulse)
                        box.pitch.setValue(pitch)
                        box.duration.setValue(snapping.value)
                        box.events.refer(reader.content.box.events)
                    }))
                if (boxOpt.nonEmpty()) {
                    selection.deselectAll()
                    selection.select(boxAdapters.adapterFor(boxOpt.unwrap(), NoteEventBoxAdapter))
                }
            } else if (target.type !== "loop-duration") {
                editing.modify(() => target.event.box.delete())
            }
        }),
        Dragging.attach(canvas, (event: PointerEvent) => {
            const target: Nullable<PitchCaptureTarget> = capturing.captureEvent(event)
            if (target === null || selection.isEmpty()) {return Option.None}
            const clientRect = canvas.getBoundingClientRect()
            if (target.type === "note-position") {
                return modifyContext.startModifier(NoteMoveModifier.create({
                    element: canvas,
                    selection,
                    positioner,
                    pointerPulse: range.xToUnit(event.clientX - clientRect.left),
                    pointerPitch: positioner.yToPitch(event.clientY - clientRect.top),
                    snapping,
                    reference: target.event
                }))
            } else if (target.type === "note-end") {
                return modifyContext.startModifier(NoteDurationModifier.create({
                    element: canvas,
                    selection,
                    pointerPulse: range.xToUnit(event.clientX - clientRect.left),
                    snapping,
                    reference: target.event
                }))
            } else {
                return panic("Unknown capture")
            }
        }, {permanentUpdates: true}),
        installContextMenu({
            element: canvas,
            snapping,
            selection,
            capturing,
            editing,
            events: reader.content.events,
            stepRecording
        }),
        positioner.subscribe(renderer.requestUpdate),
        range.subscribe(renderer.requestUpdate),
        scale.subscribe(renderer.requestUpdate),
        reader.subscribeChange(renderer.requestUpdate),
        modifyContext.subscribeUpdate(renderer.requestUpdate),
        installCursor(canvas, capturing, {
            get: (target, event) =>
                target === null ? Keyboard.isControlKey(event) && event.buttons === 0
                    ? Cursor.Pencil
                    : null : CursorMap[target.type]
        })
    )
    return (
        <div className={className} tabIndex={-1}>
            {canvas}
            <Scroller lifecycle={lifecycle}
                      model={positioner.scrollModel}
                      floating/>
            {selectionRectangle}
        </div>
    )
}