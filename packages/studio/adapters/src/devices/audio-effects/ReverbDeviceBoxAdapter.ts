import {ReverbDeviceBox} from "@dlm-daw/studio-boxes"
import {StringMapping, UUID, ValueMapping} from "@dlm-daw/lib-std"
import {Address, BooleanField, FieldKeys, Int32Field, PointerField, StringField} from "@dlm-daw/lib-box"
import {Pointers} from "@dlm-daw/studio-enums"
import {AudioEffectDeviceAdapter, DeviceHost, Devices} from "../../DeviceAdapter"
import {BoxAdaptersContext} from "../../BoxAdaptersContext"
import {ParameterAdapterSet} from "../../ParameterAdapterSet"
import {AudioUnitBoxAdapter} from "../../audio-unit/AudioUnitBoxAdapter"
import {AutomatableParameterFieldAdapter} from "../../AutomatableParameterFieldAdapter"

export class ReverbDeviceBoxAdapter implements AudioEffectDeviceAdapter {
    readonly type = "audio-effect"
    readonly accepts = "audio"

    readonly #context: BoxAdaptersContext
    readonly #box: ReverbDeviceBox
    readonly #parametric: ParameterAdapterSet
    readonly namedParameter // let typescript infer the type

    constructor(context: BoxAdaptersContext, box: ReverbDeviceBox) {
        this.#context = context
        this.#box = box
        this.#parametric = new ParameterAdapterSet(this.#context)
        this.namedParameter = this.#wrapParameters(box)
    }

    get box(): ReverbDeviceBox {return this.#box}
    get uuid(): UUID.Bytes {return this.#box.address.uuid}
    get address(): Address {return this.#box.address}
    get indexField(): Int32Field {return this.#box.index}
    get labelField(): StringField {return this.#box.label}
    get enabledField(): BooleanField {return this.#box.enabled}
    get minimizedField(): BooleanField {return this.#box.minimized}
    get host(): PointerField<Pointers.AudioEffectHost> {return this.#box.host}

    deviceHost(): DeviceHost {
        return this.#context.boxAdapters
            .adapterFor(this.#box.host.targetVertex.unwrap("no device-host").box, Devices.isHost)
    }

    audioUnitBoxAdapter(): AudioUnitBoxAdapter {return this.deviceHost().audioUnitBoxAdapter()}

    parameterAt(fieldIndices: FieldKeys): AutomatableParameterFieldAdapter {return this.#parametric.parameterAt(fieldIndices)}

    terminate(): void {this.#parametric.terminate()}

    #wrapParameters(box: ReverbDeviceBox) {
        return {
            decay: this.#parametric.createParameter(
                box.decay,
                ValueMapping.unipolar(),
                StringMapping.numeric({unit: "%", fractionDigits: 0}),
                "Room-Size"),
            preDelay: this.#parametric.createParameter(
                box.preDelay,
                ValueMapping.exponential(0.001, 0.500),
                StringMapping.numeric({
                    unit: "s", fractionDigits: 1, unitPrefix: true
                }),
                "Pre-Delay"),
            damp: this.#parametric.createParameter(
                box.damp,
                ValueMapping.unipolar(),
                StringMapping.numeric({unit: "%", fractionDigits: 0}),
                "damping"),
            filter: this.#parametric.createParameter(
                box.filter,
                ValueMapping.bipolar(),
                StringMapping.numeric({unit: "%", fractionDigits: 0}),
                "filter"),
            dry: this.#parametric.createParameter(
                box.dry,
                ValueMapping.DefaultDecibel,
                StringMapping.numeric({unit: "db", fractionDigits: 1}),
                "dry"),
            wet: this.#parametric.createParameter(
                box.wet,
                ValueMapping.DefaultDecibel,
                StringMapping.numeric({unit: "db", fractionDigits: 1}),
                "wet")
        } as const
    }
}