import {createElement, JsxValue} from "@dlm-daw/lib-jsx"
import {assertInstanceOf, isDefined, Option, Point, PrintValue, Provider} from "@dlm-daw/lib-std"
import {FloatingTextInput} from "@/ui/components/FloatingTextInput.tsx"

type Construct = {
    resolversFactory: Provider<PromiseWithResolvers<string>>
    provider: Provider<PrintValue>
    location?: Provider<Point>
}

export const DblClckTextInput = ({
                                     resolversFactory,
                                     provider,
                                     location
                                 }: Construct, [element]: ReadonlyArray<JsxValue>) => {
    assertInstanceOf(element, Element)
    element.ondblclick = () => {
        const rect = element.getBoundingClientRect()
        const option = Option.from(provider)
        if (option.isEmpty()) {return}
        const {value, unit} = option.unwrap()
        const point: Point = isDefined(location) ? location() : {x: rect.left, y: rect.top + (rect.height >> 1)}
        element.ownerDocument.body.appendChild(
            <FloatingTextInput position={point}
                               value={value}
                               unit={unit}
                               resolvers={resolversFactory()}/>
        )
    }
    return element
}