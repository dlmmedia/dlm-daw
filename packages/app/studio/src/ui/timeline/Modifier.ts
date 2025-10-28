import {Dragging} from "@dlm-daw/lib-dom"
import {Editing} from "@dlm-daw/lib-box"

export interface Modifier {
    update(event: Dragging.Event): void
    approve(editing: Editing): void
    cancel(): void
}