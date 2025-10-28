import css from "./AudioEditorHeader.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {StudioService} from "@/service/StudioService.ts"
import {createElement} from "@dlm-daw/lib-jsx"
import {Html} from "@dlm-daw/lib-dom"

const className = Html.adoptStyleSheet(css, "AudioEditorHeader")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
}

export const AudioEditorHeader = ({}: Construct) => (
    <div className={className}>
        <p className="help-section">
            Navigatable but otherwise non-functional yet
        </p>
    </div>
)