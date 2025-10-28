import css from "./DeviceMidiMeter.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {createElement, DomElement} from "@dlm-daw/lib-jsx"
import {Address} from "@dlm-daw/lib-box"
import {LiveStreamReceiver} from "@dlm-daw/lib-fusion"
import {Html} from "@dlm-daw/lib-dom"
import {NoteStreamReceiver} from "@dlm-daw/studio-adapters"
import {Colors} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "DeviceMidiMeter")

type Construct = {
    lifecycle: Lifecycle
    receiver: LiveStreamReceiver
    address: Address
}

export const DeviceMidiMeter = ({lifecycle, receiver, address}: Construct) => {
    const size = 8
    const indicator: DomElement = (
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill={Colors.shadow} visibility="hidden"/>
    )
    const streamReceiver = lifecycle.own(new NoteStreamReceiver(receiver, address))
    lifecycle.own(streamReceiver.subscribe(state =>
        indicator.style.visibility = state.isAnyNoteOn() ? "visible" : "hidden"))
    return (
        <svg classList={className} viewBox={`0 0 ${size} ${size}`} width={size} height={size}>{indicator}</svg>
    )
}