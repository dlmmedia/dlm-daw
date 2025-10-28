import css from "./NoteLabel.sass?inline"
import {Html} from "@dlm-daw/lib-dom"
import {int, Lifecycle, ObservableValue} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {MidiKeys} from "@dlm-daw/lib-dsp"

const className = Html.adoptStyleSheet(css, "NoteLabel")

type Construct = {
    lifecycle: Lifecycle
    octave: ObservableValue<int>
    semitone: int
}

export const NoteLabel = ({lifecycle, octave, semitone}: Construct) => {
    const label: HTMLElement = (
        <div className={className}/>
    )
    lifecycle.own(octave.catchupAndSubscribe(owner =>
        label.textContent = MidiKeys.toFullString(owner.getValue() * 12 + semitone)))
    return label
}