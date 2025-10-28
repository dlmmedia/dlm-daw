import {Pointers} from "@dlm-daw/studio-enums"
import {StringMapping, UUID, ValueMapping} from "@dlm-daw/lib-std"
import {Address, BooleanField, FieldKeys, Int32Field, PointerField, StringField} from "@dlm-daw/lib-box"
import {PitchDeviceBox} from "@dlm-daw/studio-boxes"
import {DeviceHost, Devices, MidiEffectDeviceAdapter} from "../../DeviceAdapter"
import {BoxAdaptersContext} from "../../BoxAdaptersContext"
import {ParameterAdapterSet} from "../../ParameterAdapterSet"
import {AudioUnitBoxAdapter} from "../../audio-unit/AudioUnitBoxAdapter"
import { AutomatableParameterFieldAdapter } from "../../AutomatableParameterFieldAdapter"

export class PitchDeviceBoxAdapter implements MidiEffectDeviceAdapter {
    readonly type = "midi-effect"
    readonly accepts = "midi"

    readonly #context: BoxAdaptersContext
    readonly #box: PitchDeviceBox
    readonly #parametric: ParameterAdapterSet
    readonly namedParameter // let typescript infer the type

    constructor(context: BoxAdaptersContext, box: PitchDeviceBox) {
        this.#context = context
        this.#box = box
        this.#parametric = new ParameterAdapterSet(this.#context)
        this.namedParameter = this.#wrapParameters(box)
    }

    get box(): PitchDeviceBox {return this.#box}
    get uuid(): UUID.Bytes {return this.#box.address.uuid}
    get address(): Address {return this.#box.address}
    get indexField(): Int32Field {return this.#box.index}
    get labelField(): StringField {return this.#box.label}
    get enabledField(): BooleanField {return this.#box.enabled}
    get minimizedField(): BooleanField {return this.#box.minimized}
    get host(): PointerField<Pointers.MidiEffectHost> {return this.#box.host}

    deviceHost(): DeviceHost {
        return this.#context.boxAdapters
            .adapterFor(this.#box.host.targetVertex.unwrap("no device-host").box, Devices.isHost)
    }

    audioUnitBoxAdapter(): AudioUnitBoxAdapter {return this.deviceHost().audioUnitBoxAdapter()}

    parameterAt(fieldIndices: FieldKeys): AutomatableParameterFieldAdapter {return this.#parametric.parameterAt(fieldIndices)}

    terminate(): void {this.#parametric.terminate()}

    #wrapParameters(box: PitchDeviceBox) {
        return {
            octaves: this.#parametric.createParameter(
                box.octaves,
                ValueMapping.linearInteger(-7, 7),
                StringMapping.numeric({unit: "oct", fractionDigits: 0}), "octaves"),
            semiTones: this.#parametric.createParameter(
                box.semiTones,
                ValueMapping.linearInteger(-36, 36),
                StringMapping.numeric({unit: "st", fractionDigits: 0}), "semi-tones"),
            cent: this.#parametric.createParameter(
                box.cents,
                ValueMapping.linear(-50.0, 50.0),
                StringMapping.numeric({unit: "cents", fractionDigits: 1}), "cents")
        } as const
    }
}