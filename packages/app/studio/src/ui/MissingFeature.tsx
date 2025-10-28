import css from "./MissingFeature.sass?inline"
import {createElement} from "@dlm-daw/lib-jsx"
import {Html} from "@dlm-daw/lib-dom"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "MissingFeature")

type Construct = { error: unknown }

export const MissingFeature = ({error}: Construct) => {
    return (
        <div className={className}>
            <h1>Feature Not Available</h1>
            <h2>An important feature <span style={{color: Colors.purple}}>"{error}"</span> is missing.</h2>
            <p>Please update your browser or switch to the latest Chrome (recommended).</p>
            <p>This application should run on all modern browsers like Chrome, Edge, Firefox, and Safari.</p>
            <p>If you are already using one of these browsers, please check your browser settings and extensions.</p>
        </div>
    )
}