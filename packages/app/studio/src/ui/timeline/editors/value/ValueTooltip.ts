import {Nullable, Option, StringMapping, Terminable, ValueAxis} from "@dlm-daw/lib-std"
import {ValueCaptureTarget} from "@/ui/timeline/editors/value/ValueEventCapturing"
import {Surface} from "@/ui/surface/Surface"
import {ValueModifyStrategy} from "@/ui/timeline/editors/value/ValueModifyStrategies"
import {Events} from "@dlm-daw/lib-dom"
import {ElementCapturing} from "@/ui/canvas/capturing"
import {ValueEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader"
import {ValueEditingContext} from "@/ui/timeline/editors/value/ValueEditingContext"
import {ObservableModifyContext} from "@/ui/timeline/ObservableModifyContext"
import {ValueModifier} from "@/ui/timeline/editors/value/ValueModifier"
import {ValueEvent} from "@dlm-daw/lib-dsp"
import {TimelineRange} from "@dlm-daw/studio-core"

export namespace ValueTooltip {
    type Creation = {
        element: Element
        capturing: ElementCapturing<ValueCaptureTarget>
        range: TimelineRange
        valueAxis: ValueAxis
        reader: ValueEventOwnerReader
        context: ValueEditingContext
        modifyContext: ObservableModifyContext<ValueModifier>
    }

    export const install = (
        {element, capturing, range, valueAxis, reader, context, modifyContext}: Creation): Terminable =>
        Terminable.many(
            Events.subscribe(element, "pointermove", ({clientX, clientY, buttons}: PointerEvent) => {
                if (buttons > 0) {return}
                const target: Nullable<ValueCaptureTarget> = capturing.capturePoint(clientX, clientY)
                if (target?.type === "event") {
                    const event = target.event
                    Surface.get(element).valueTooltip.show(() => {
                        const strategy: Option<ValueModifyStrategy> = modifyContext.modifier
                        const modifier: ValueModifyStrategy = strategy.unwrapOrElse(ValueModifyStrategy.Identity)
                        const clientRect = element.getBoundingClientRect()
                        const clientX = range.unitToX(modifier.readPosition(event) + reader.offset) + clientRect.left + 8
                        const value = modifier.readValue(event)
                        const clientY = valueAxis.valueToAxis(value) + clientRect.top + 8
                        return ({...context.stringMapping.x(context.valueMapping.y(value)), clientX, clientY})
                    })
                } else if (target?.type === "curve") {
                    const event = target.event
                    const mostRightEvent = ValueEvent.nextEvent(reader.content.events, event) ?? event
                    Surface.get(element).valueTooltip.show(() => {
                        const stringMapping = StringMapping.numeric({unit: "bend", bipolar: true, fractionDigits: 2})
                        const strategy: Option<ValueModifyStrategy> = modifyContext.modifier
                        const modifier: ValueModifyStrategy = strategy.unwrapOrElse(ValueModifyStrategy.Identity)
                        const clientRect = element.getBoundingClientRect()
                        const clientX = range.unitToX(modifier.readPosition(mostRightEvent) + reader.offset) + clientRect.left + 8
                        const clientY = valueAxis.valueToAxis(modifier.readValue(mostRightEvent)) + clientRect.top + 8
                        const interpolation = modifier.readInterpolation(event)
                        const slope = interpolation.type !== "curve" ? 0.5 : interpolation.slope
                        return ({...stringMapping.x(slope), clientX, clientY})
                    })
                } else {
                    Surface.get(element).valueTooltip.hide()
                }
            }),
            Events.subscribe(element, "pointerleave", () => Surface.get(element).valueTooltip.hide())
        )
}