import {UUID} from "@dlm-daw/lib-std"
import {Address, BooleanField, Int32Field, PointerField, StringField} from "@dlm-daw/lib-box"
import {Pointers} from "@dlm-daw/studio-enums"
import {UnknownMidiEffectDeviceBox} from "@dlm-daw/studio-boxes"
import {BoxAdaptersContext} from "../../BoxAdaptersContext"
import {DeviceHost, Devices, MidiEffectDeviceAdapter} from "../../DeviceAdapter"
import {AudioUnitBoxAdapter} from "../../audio-unit/AudioUnitBoxAdapter"

export class UnknownMidiEffectDeviceBoxAdapter implements MidiEffectDeviceAdapter {
    readonly type = "midi-effect"
    readonly accepts = "midi"

    readonly #context: BoxAdaptersContext
    readonly #box: UnknownMidiEffectDeviceBox

    constructor(context: BoxAdaptersContext, box: UnknownMidiEffectDeviceBox) {
        this.#context = context
        this.#box = box
    }

    get box(): UnknownMidiEffectDeviceBox {return this.#box}
    get uuid(): UUID.Bytes {return this.#box.address.uuid}
    get address(): Address {return this.#box.address}
    get indexField(): Int32Field {return this.#box.index}
    get labelField(): StringField {return this.#box.label}
    get enabledField(): BooleanField {return this.#box.enabled}
    get minimizedField(): BooleanField {return this.#box.minimized}
    get host(): PointerField<Pointers.MidiEffectHost> {return this.#box.host}
    get commentField(): StringField {return this.#box.comment}

    deviceHost(): DeviceHost {
        return this.#context.boxAdapters
            .adapterFor(this.#box.host.targetVertex.unwrap("no device-host").box, Devices.isHost)
    }

    audioUnitBoxAdapter(): AudioUnitBoxAdapter {return this.deviceHost().audioUnitBoxAdapter()}

    terminate(): void {}
}