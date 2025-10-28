import css from "./EmptySlot.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {int, Lifecycle, ObservableValue, Option} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {StudioService} from "@/service/StudioService.ts"
import {SampleSelector} from "@/ui/devices/SampleSelector"
import {SlotDragAndDrop} from "@/ui/devices/instruments/PlayfieldDeviceEditor/SlotDragAndDrop"
import {NoteLabel} from "@/ui/devices/instruments/PlayfieldDeviceEditor/NoteLabel"
import {Icon} from "@/ui/components/Icon"
import {IconSymbol, NoteStreamReceiver} from "@dlm-daw/studio-adapters"
import {ContextMenu} from "@/ui/ContextMenu"

const className = Html.adoptStyleSheet(css, "EmptySlot")

type Construct = {
    lifecycle: Lifecycle
    service: StudioService
    noteReceiver: NoteStreamReceiver
    sampleSelector: SampleSelector
    octave: ObservableValue<int>
    semitone: int
}

export const EmptySlot = (
    {lifecycle, service: {project}, noteReceiver, sampleSelector, octave, semitone}: Construct) => {
    const browseButton: HTMLElement = (
        <div className="audio-file">
            <Icon symbol={IconSymbol.AudioFile}/>
        </div>
    )
    const element: HTMLElement = (
        <div className={className}>
            <header/>
            {browseButton}
            <footer>
                <NoteLabel lifecycle={lifecycle} octave={octave} semitone={semitone}/>
            </footer>
        </div>
    )
    lifecycle.ownAll(
        SlotDragAndDrop.install({
            element,
            project,
            sample: Option.None,
            octave,
            semitone
        }),
        sampleSelector.configureDrop(element),
        sampleSelector.configureBrowseClick(browseButton),
        noteReceiver.subscribe((receiver) => browseButton.classList
            .toggle("playing", receiver.isNoteOn(octave.getValue() * 12 + semitone))),
        ContextMenu.subscribe(element, collector => collector.addItems(sampleSelector.createBrowseMenuData()))
    )
    return element
}