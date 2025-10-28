import css from "./BackButton.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {Icon} from "@/ui/components/Icon"
import {IconSymbol} from "@dlm-daw/studio-adapters"
import {createElement, LocalLink} from "@dlm-daw/lib-jsx"

const className = Html.adoptStyleSheet(css, "BackButton")

export const BackButton = () => {
    return (
        <div className={className}>
            <LocalLink href="/">
                <Icon symbol={IconSymbol.DLMDAW} style={{fontSize: "1.25em"}}/><span>GO BACK TO STUDIO</span>
            </LocalLink>
        </div>
    )
}