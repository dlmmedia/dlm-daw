import css from "./AudioUnitTracks.sass?inline"
import {Lifecycle} from "@dlm-daw/lib-std"
import {createElement} from "@dlm-daw/lib-jsx"
import {Vertex} from "@dlm-daw/lib-box"
import {Html} from "@dlm-daw/lib-dom"
import {AudioUnitType} from "@dlm-daw/studio-enums"
import {AudioUnitBoxAdapter, Devices} from "@dlm-daw/studio-adapters"
import {Project} from "@dlm-daw/studio-core"

const className = Html.adoptStyleSheet(css, "AudioUnitTracks")

type Construct = {
    lifecycle: Lifecycle
    project: Project
    adapter: AudioUnitBoxAdapter
}

export const AudioUnitTracks = ({lifecycle, project, adapter}: Construct) => {
    const isBus = adapter.type === AudioUnitType.Bus
    const isAux = adapter.type === AudioUnitType.Aux
    const isOutput = adapter.type === AudioUnitType.Output
    const element: HTMLElement = (<div className={Html.buildClassList(className,
        isAux && "aux", isBus && "bus", isOutput && "output")}/>)
    const audioUnitEditing = project.userEditingManager.audioUnit
    lifecycle.ownAll(
        adapter.indexField.catchupAndSubscribe(field => element.style.gridRow = `${field.getValue() + 1}`),
        audioUnitEditing.catchupAndSubscribe(optVertex => optVertex.match({
            none: () => element.classList.remove("editing"),
            some: (vertex: Vertex) => {
                const editing = project.boxAdapters.adapterFor(vertex.box, Devices.isHost).audioUnitBoxAdapter()
                element.classList.toggle("editing", editing === adapter)
            }
        }))
    )
    return element
}