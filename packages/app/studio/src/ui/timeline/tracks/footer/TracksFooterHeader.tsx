import css from "./TracksFooterHeader.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {createElement} from "@dlm-daw/lib-jsx"

const className = Html.adoptStyleSheet(css, "TracksFooterHeader")

export const TracksFooterHeader = () => {
    return (<div className={className}/>)
}