import {Events, Html} from "@dlm-daw/lib-dom"
import css from "./TextInput.sass?inline"
import {int, isDefined, isInstanceOf, Lifecycle, MutableObservableValue} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"

const defaultClassName = Html.adoptStyleSheet(css, "TextInput")

type Construct = {
    lifecycle: Lifecycle
    model: MutableObservableValue<string>
    className?: string
    maxChars?: int
}

export const TextInput = ({lifecycle, model, className, maxChars}: Construct) => {
    maxChars ??= 127
    const input: HTMLElement = (<div contentEditable="true" style={{width: "100%"}}/>)
    const element: HTMLElement = (
        <div className={Html.buildClassList(defaultClassName, className)}>
            {input}
        </div>
    )
    const update = () => input.textContent = model.getValue()
    lifecycle.ownAll(
        Events.subscribe(element, "focusin", (event: Event) => {
            if (!isInstanceOf(event.target, HTMLElement)) {return}
            Html.selectContent(event.target)
        }),
        Events.subscribe(element, "focusout", (event: Event) => {
            if (!isInstanceOf(event.target, HTMLElement)) {return}
            update()
            Html.unselectContent(event.target)
        }),
        Events.subscribe(element, "copy", (event: ClipboardEvent) => {
            event.preventDefault()
            event.clipboardData?.setData("application/json", JSON.stringify({
                app: "dlm-daw",
                content: "text",
                value: model.getValue()
            }))
        }),
        Events.subscribe(element, "paste", (event: ClipboardEvent) => {
            const data = event.clipboardData?.getData("application/json")
            if (isDefined(data)) {
                const json = JSON.parse(data)
                if (json.app === "dlm-daw" && json.content === "text") {
                    event.preventDefault()
                    model.setValue(json.value)
                }
            }
        }),
        Events.subscribe(element, "input", (event: Event) => {
            const target = event.target
            if (!isInstanceOf(target, HTMLElement)) {return}
            const newValue = target.textContent?.slice(0, maxChars) ?? ""
            model.setValue(newValue)
        })
    )
    update()
    return element
}