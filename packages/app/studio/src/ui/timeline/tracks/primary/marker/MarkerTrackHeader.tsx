import css from "./MarkerTrackHeader.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {createElement} from "@dlm-daw/lib-jsx"

const className = Html.adoptStyleSheet(css, "MarkerTrackHeader")

export const MarkerTrackHeader = () => {
    return (<div className={className}>Markers</div>)
}