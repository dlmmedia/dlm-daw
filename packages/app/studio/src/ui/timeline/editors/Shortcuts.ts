import {Selection} from "@dlm-daw/lib-std"
import {TimelineSelectableLocator} from "@/ui/timeline/TimelineSelectableLocator.ts"
import {Editing} from "@dlm-daw/lib-box"
import {Event} from "@dlm-daw/lib-dsp"
import {Events, Keyboard} from "@dlm-daw/lib-dom"
import {BoxAdapter} from "@dlm-daw/studio-adapters"

export const attachShortcuts = <E extends Event & BoxAdapter>(element: Element,
                                                              editing: Editing,
                                                              selection: Selection<E>,
                                                              locator: TimelineSelectableLocator<E>) =>
    Events.subscribe(element, "keydown", (event: KeyboardEvent) => {
        if (Keyboard.GlobalShortcut.isSelectAll(event)) {
            selection.select(...locator.selectable())
        } else if (Keyboard.GlobalShortcut.isDelete(event)) {
            editing.modify(() => selection.selected()
                .forEach(event => event.box.delete()))
        }
    })