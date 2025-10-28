import {asInstanceOf, isDefined, Maybe, Option, SortedSet, Subscription, Terminable, UUID} from "@dlm-daw/lib-std"
import {AudioUnitBox, BoxVisitor, CaptureAudioBox, CaptureMidiBox} from "@dlm-daw/studio-boxes"
import {Project} from "../project/Project"
import {Capture} from "./Capture"
import {CaptureMidi} from "./CaptureMidi"
import {CaptureAudio} from "./CaptureAudio"

export class CaptureDevices implements Terminable {
    readonly #project: Project
    readonly #subscription: Subscription
    readonly #captures: SortedSet<UUID.Bytes, Capture>

    constructor(project: Project) {
        this.#project = project
        this.#captures = UUID.newSet<Capture>(unit => unit.uuid)
        this.#subscription = this.#project.rootBox.audioUnits.pointerHub.catchupAndSubscribeTransactual({
            onAdd: ({box}) => {
                const audioUnitBox = asInstanceOf(box, AudioUnitBox)
                const capture: Maybe<Capture> = audioUnitBox.capture.targetVertex
                    .ifSome(({box}) => box.accept<BoxVisitor<Capture>>({
                        visitCaptureMidiBox: (box: CaptureMidiBox) => new CaptureMidi(this, audioUnitBox, box),
                        visitCaptureAudioBox: (box: CaptureAudioBox) => new CaptureAudio(this, audioUnitBox, box)
                    }))
                if (isDefined(capture)) {this.#captures.add(capture)}
            },
            onRemove: ({box: {address: {uuid}}}) => this.#captures.removeByKeyIfExist(uuid)?.terminate()
        })
    }

    get project(): Project {return this.#project}

    get(uuid: UUID.Bytes): Option<Capture> {return this.#captures.opt(uuid)}

    setArm(subject: Capture, exclusive: boolean): void {
        const arming = !subject.armed.getValue()
        subject.armed.setValue(arming)
        if (arming && exclusive) {
            this.#captures.values()
                .filter(capture => subject !== capture)
                .forEach(capture => capture.armed.setValue(false))
        }
    }

    filterArmed(): ReadonlyArray<Capture> {
        return this.#captures.values()
            .filter(capture => capture.armed.getValue() && capture.audioUnitBox.input.pointerHub.nonEmpty())
    }

    terminate(): void {
        this.#subscription.terminate()
        this.#captures.forEach(capture => capture.terminate())
        this.#captures.clear()
    }
}