import css from "./FlexSpace.sass?inline"
import {createElement} from "@dlm-daw/lib-jsx"
import {Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "FlexSpace")

export const FlexSpace = () => (<div className={className}/>)