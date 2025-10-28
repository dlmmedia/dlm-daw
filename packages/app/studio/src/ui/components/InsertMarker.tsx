import css from "./InsertMarker.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {IconSymbol} from "@dlm-daw/studio-adapters"
import {Icon} from "@/ui/components/Icon"
import {createElement} from "@dlm-daw/lib-jsx"

const className = Html.adoptStyleSheet(css, "InsertMarker")

export const InsertMarker = () => {
    return (
        <div className={className}>
            <Icon symbol={IconSymbol.ArrayDown}/>
        </div>
    )
}