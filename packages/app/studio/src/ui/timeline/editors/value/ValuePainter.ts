import {Arrays, Func, Option, Procedure, Provider, TAU, unitValue} from "@dlm-daw/lib-std"
import {Snapping} from "@/ui/timeline/Snapping.ts"
import {CanvasPainter} from "@/ui/canvas/painter.ts"
import {renderValueStream} from "@/ui/timeline/renderer/value.ts"
import {ValueEvent} from "@dlm-daw/lib-dsp"
import {renderTimeGrid} from "@/ui/timeline/editors/TimeGridRenderer.ts"
import {EventRadius} from "@/ui/timeline/editors/value/Constants.ts"
import {ObservableModifyContext} from "@/ui/timeline/ObservableModifyContext.ts"
import {ValueModifier} from "./ValueModifier"
import {ValueModifyStrategy} from "@/ui/timeline/editors/value/ValueModifyStrategies.ts"
import {ValueEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader.ts"
import {UIValueEvent} from "@/ui/timeline/editors/value/UIValueEvent.ts"
import {ValueEditingContext} from "@/ui/timeline/editors/value/ValueEditingContext"
import {TimelineRange} from "@dlm-daw/studio-core"

export type Construct = {
    range: TimelineRange
    valueToPixel: Func<unitValue, number>
    modifyContext: ObservableModifyContext<ValueModifier>
    snapping: Snapping
    valueEditing: ValueEditingContext
    reader: ValueEventOwnerReader
}

export const createValuePainter =
    ({range, valueToPixel, modifyContext, snapping, valueEditing, reader}: Construct)
        : Procedure<CanvasPainter> => (painter: CanvasPainter) => {
        const modifier: Option<ValueModifyStrategy> = modifyContext.modifier
        const context = painter.context
        const {width, height} = context.canvas
        const {fontFamily, fontSize} = getComputedStyle(context.canvas)
        const em = Math.ceil(parseFloat(fontSize) * devicePixelRatio)
        context.save()
        context.textBaseline = "hanging"
        context.font = `${em}px ${fontFamily}`
        const y0 = Math.floor(valueToPixel(1.0))
        const y1 = Math.floor(valueToPixel(0.0))
        renderTimeGrid(context, range, snapping, y0, y1)
        // LOOP DURATION
        const offset = reader.offset
        const x0 = Math.floor(range.unitToX(offset) * devicePixelRatio)
        const x1 = Math.floor(range.unitToX(offset + modifier.match({
            none: () => reader.contentDuration,
            some: strategy => strategy.readContentDuration(reader)
        })) * devicePixelRatio)
        if (x0 > 0) {
            context.fillStyle = `hsla(${reader.hue}, 60%, 60%, 0.30)`
            context.fillRect(x0, 0, devicePixelRatio, height)
        }
        if (x1 > 0) {
            context.fillStyle = `hsla(${reader.hue}, 60%, 60%, 0.03)`
            context.fillRect(x0, 0, x1 - x0, height)
            context.fillStyle = `hsla(${reader.hue}, 60%, 60%, 0.30)`
            context.fillRect(x1, 0, devicePixelRatio, height)
        }
        // min/max dashed lines
        context.strokeStyle = "rgba(255, 255, 255, 0.25)"
        context.setLineDash([devicePixelRatio, devicePixelRatio * 2])
        context.beginPath()
        context.moveTo(0, y0)
        context.lineTo(width, y0)
        valueEditing.assignment.getValue().ifSome(x => {
            const y = valueToPixel(x.adapter.getUnitValue())
            context.moveTo(0, y)
            context.lineTo(width, y)
        })
        context.moveTo(0, y1)
        context.lineTo(width, y1)
        context.stroke()
        context.setLineDash(Arrays.empty())
        context.lineWidth = devicePixelRatio
        const contentColor = `hsl(${reader.hue}, 60%, 45%)`
        const start = range.unitMin - range.unitPadding
        const end = range.unitMax
        const events = reader.content.events

        const createIterator = modifier.match<Provider<Generator<UIValueEvent>>>({
            none: () => () => ValueEvent.iterateWindow(events, start - offset, end - offset),
            some: (strategy: ValueModifyStrategy) => {
                const snapValue = strategy.snapValue()
                if (snapValue.nonEmpty()) {
                    const y = valueToPixel(snapValue.unwrap())
                    context.strokeStyle = "rgba(255, 255, 255, 0.25)"
                    context.setLineDash([devicePixelRatio, devicePixelRatio * 4])
                    context.beginPath()
                    context.moveTo(0, y)
                    context.lineTo(width, y)
                    context.stroke()
                    context.setLineDash(Arrays.empty())
                }
                const valueEvents = Array.from(strategy.iterator(start - offset, end - offset))
                return () => Arrays.iterate(valueEvents)
            }
        })
        renderValueStream(context, range, createIterator(), valueToPixel, contentColor, 0.04, valueEditing.anchorModel.getValue(), {
            index: 0,
            rawStart: offset,
            rawEnd: offset + reader.loopDuration,
            regionStart: Math.max(offset, reader.position),
            regionEnd: Math.min(offset + reader.loopDuration, reader.complete),
            resultStart: start,
            resultEnd: end,
            resultStartValue: 0.0,
            resultEndValue: 1.0
        })
        for (const event of createIterator()) {
            context.fillStyle = event.isSelected ? "white" : contentColor
            const x = range.unitToX(offset + event.position) * devicePixelRatio
            const y = valueToPixel(event.value)
            context.beginPath()
            context.arc(x, y, EventRadius * devicePixelRatio, 0.0, TAU)
            context.fill()
        }
    }