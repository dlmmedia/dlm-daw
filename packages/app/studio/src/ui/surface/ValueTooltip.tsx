import css from "./ValueTooltip.sass?inline"
import {Surface} from "./Surface"
import {createElement} from "@dlm-daw/lib-jsx"
import {int, PrintValue, Provider, Terminable} from "@dlm-daw/lib-std"
import {AbstractTooltip} from "@/ui/surface/AbstractTooltip.ts"
import {Events, Html} from "@dlm-daw/lib-dom"

export interface ValueData extends PrintValue {
    clientX: number
    clientY: number
}

export class ValueTooltip extends AbstractTooltip<ValueData> {
    static readonly SHOW_DELAY: int = 30
    static readonly HIDE_DELAY: int = 20

    static default(element: Element, provider: Provider<ValueData>): Terminable {
        return Terminable.many(
            Events.subscribe(element, "pointerdown", () => {
                const surface = Surface.get(element)
                surface.valueTooltip.show(provider)
                Events.subscribe(element, "pointerleave", () => surface.valueTooltip.hide(), {once: true})
            }),
            Events.subscribe(element, "pointerenter", () => {
                const surface = Surface.get(element)
                surface.valueTooltip.show(provider)
                Events.subscribe(element, "pointerleave", () => surface.valueTooltip.hide(), {once: true})
            }),
            Terminable.create(() => Surface.get(element).textTooltip.forceHide())
        )
    }

    // DO NOT INLINE: This sheet needs to be initialized upfront to be copied over to new documents
    static readonly #CLASS_NAME = Html.adoptStyleSheet(css, "ValueTooltip")

    constructor(surface: Surface) {super(surface)}

    protected createElement(): HTMLElement {return (<div className={ValueTooltip.#CLASS_NAME}/>)}
    protected showDelayInFrames(): number {return 30}
    protected hideDelayInFrames(): number {return 20}

    update({value, unit}: ValueData): void {
        this.element.setAttribute("unit", unit)
        this.element.textContent = value
    }
}