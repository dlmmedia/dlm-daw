import css from "./UpdateMessage.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {createElement} from "@dlm-daw/lib-jsx"

const className = Html.adoptStyleSheet(css, "UpdateMessage")

export const UpdateMessage = () => {
    return (
        <div className={className}>
            Update available! (please reload)
        </div>
    )
}