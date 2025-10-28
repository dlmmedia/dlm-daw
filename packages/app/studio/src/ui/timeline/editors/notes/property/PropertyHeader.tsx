import css from "./PropertyHeader.sass?inline"
import {Lifecycle, MutableObservableValue} from "@dlm-daw/lib-std"
import {createElement, Inject} from "@dlm-daw/lib-jsx"
import {DropDown} from "@/ui/composite/DropDown.tsx"
import {NotePropertyAccessors, PropertyAccessor} from "@/ui/timeline/editors/notes/property/PropertyAccessor.ts"
import {FlexSpacer} from "@/ui/components/FlexSpacer.tsx"
import {Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "PropertyHeader")

type Construct = {
    lifecycle: Lifecycle
    propertyOwner: MutableObservableValue<PropertyAccessor>
}

export const PropertyHeader = ({lifecycle, propertyOwner}: Construct) => {
    const minValue = Inject.value("")
    const maxValue = Inject.value("")
    const updateMinmaxLabels = () => {
        const [min, max] = propertyOwner.getValue().minmaxLabels
        minValue.value = min
        maxValue.value = max
    }
    lifecycle.own(propertyOwner.subscribe(updateMinmaxLabels))
    updateMinmaxLabels()
    return (
        <div className={className}>
            <FlexSpacer/>
            <DropDown lifecycle={lifecycle}
                      mapping={property => (property.label)}
                      owner={propertyOwner}
                      provider={() => NotePropertyAccessors}
                      width="3.5rem"/>
            <div className="range-labels">
                <span>{maxValue}</span>
                <hr/>
                <span>{minValue}</span>
            </div>
        </div>
    )
}