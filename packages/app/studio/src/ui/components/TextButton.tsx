import css from "./TextButton.sass?inline"
import {Exec} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "TextButton")

export const TextButton = ({onClick}: { onClick: Exec }) => (
    <div className={className} onclick={onClick}/>
)