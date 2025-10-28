import css from "./NumberInput.sass?inline"
import {Events, Html} from "@dlm-daw/lib-dom"
import {int, isDefined, isInstanceOf, Lifecycle, MutableObservableValue, StringMapping} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"

const defaultClassName = Html.adoptStyleSheet(css, "NumberInput")

type Construct = {
    lifecycle: Lifecycle
    model: MutableObservableValue<number>
    mapper?: StringMapping<number>
    negativeWarning?: boolean
    className?: string
    maxChars?: int
    step?: number
}

export const NumberInput = ({lifecycle, model, negativeWarning, className, maxChars, mapper, step}: Construct) => {
    step ??= 1.0
    maxChars ??= 3
    mapper ??= StringMapping.numeric({})
    const input: HTMLElement = (<div contentEditable="true" style={{width: `calc(0.5em + ${maxChars * 6 + 1}px)`}}/>)
    const element: HTMLElement = (
        <div className={Html.buildClassList(defaultClassName, className)}>
            {input}
        </div>
    )
    const updateDigits = () => {
        const value = model.getValue()
        element.classList.toggle("negative", negativeWarning === true && value < 0)
        input.textContent = mapper.x(value).value
    }
    lifecycle.ownAll(
        model.subscribe(updateDigits),
        Events.subscribe(element, "focusin", (event: Event) => {
            if (!isInstanceOf(event.target, HTMLElement)) {return}
            Html.selectContent(event.target)
        }),
        Events.subscribe(element, "focusout", (event: Event) => {
            if (!isInstanceOf(event.target, HTMLElement)) {return}
            updateDigits()
            Html.unselectContent(event.target)
        }),
        Events.subscribe(element, "copy", (event: ClipboardEvent) => {
            event.preventDefault()
            event.clipboardData?.setData("application/json", JSON.stringify({
                app: "dlm-daw",
                content: "number",
                value: model.getValue()
            }))
        }),
        Events.subscribe(element, "paste", (event: ClipboardEvent) => {
            const data = event.clipboardData?.getData("application/json")
            if (isDefined(data)) {
                const json = JSON.parse(data)
                if (json.app === "dlm-daw" && json.content === "number") {
                    event.preventDefault()
                    model.setValue(json.value)
                }
            }
        }),
        Events.subscribe(element, "keydown", (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {return}
            const target = event.target
            if (!isInstanceOf(target, HTMLElement)) {return}
            switch (event.code) {
                case "ArrowUp": {
                    event.preventDefault()
                    const result = mapper.y(target.textContent ?? "")
                    if (result.type !== "explicit") {return}
                    const nextValue: int = result.value
                    model.setValue(nextValue + step)
                    Html.selectContent(target)
                    break
                }
                case "ArrowDown": {
                    event.preventDefault()
                    const result = mapper.y(target.textContent ?? "")
                    if (result.type !== "explicit") {return}
                    const nextValue: int = result.value
                    model.setValue(nextValue - step)
                    Html.selectContent(target)
                    break
                }
                case "Enter": {
                    event.preventDefault()
                    const result = mapper.y(target.textContent ?? "")
                    if (result.type !== "explicit") {return}
                    const nextValue: int = result.value
                    model.setValue(nextValue)
                    updateDigits()
                    Html.selectContent(target)
                    break
                }
                case "Digit1":
                case "Digit2":
                case "Digit3":
                case "Digit4":
                case "Digit5":
                case "Digit6":
                case "Digit7":
                case "Digit8":
                case "Digit9":
                case "Digit0":
                case "Tab":
                case "ArrowLeft":
                case "ArrowRight":
                case "Minus":
                case "Backspace": {
                    break // Allow
                }
                default: {
                    console.debug("ignore", event.code)
                    event.preventDefault()
                }
            }
        })
    )
    updateDigits()
    return element
}