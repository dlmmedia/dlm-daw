import {BandSchema, EqBandType, EqualizerSchema, ParameterDecoder} from "@dlm-daw/lib-dawproject"
import {RevampDeviceBox, RevampPass, RevampShelf} from "@dlm-daw/studio-boxes"
import {BoxGraph, Field} from "@dlm-daw/lib-box"
import {ifDefined, int, UUID} from "@dlm-daw/lib-std"
import {Pointers} from "@dlm-daw/studio-enums"
import {semitoneToHz} from "@dlm-daw/lib-dsp"

export namespace BuiltinDevices {
    export const equalizer = (boxGraph: BoxGraph,
                              equalizer: EqualizerSchema,
                              field: Field<Pointers.MidiEffectHost> | Field<Pointers.AudioEffectHost>,
                              index: int): RevampDeviceBox => {
        const mapOrder = (order?: int) => {
            switch (order) {
                case 1:
                case 2:
                    return 0
                case 3:
                case 4:
                    return 1
                case 5:
                case 6:
                    return 2
                default:
                    return 3
            }
        }
        const readPass = (schema: BandSchema, pass: RevampPass) => {
            const {order, frequency, q, enabled} = pass
            order.setValue(mapOrder(schema.order))
            frequency.setValue(semitoneToHz(schema.freq.value))
            ifDefined(schema.Q?.value, value => q.setValue(value))
            ifDefined(schema.enabled?.value, value => enabled.setValue(value))
        }
        const readShelf = (schema: BandSchema, pass: RevampShelf) => {
            const {frequency, gain, enabled} = pass
            frequency.setValue(ParameterDecoder.readValue(schema.freq))
            ifDefined(schema.gain?.value, value => gain.setValue(value))
            ifDefined(schema.enabled?.value, value => enabled.setValue(value))
        }
        return RevampDeviceBox.create(boxGraph, UUID.generate(), box => {
            box.host.refer(field)
            box.index.setValue(index)
            box.label.setValue(equalizer.deviceName ?? "Revamp")
            let bellIndex: int = 0
            equalizer.bands.forEach((band) => {
                switch (band.type) {
                    case EqBandType.HIGH_PASS:
                        return readPass(band, box.highPass)
                    case EqBandType.LOW_PASS:
                        return readPass(band, box.lowPass)
                    case EqBandType.HIGH_SHELF:
                        return readShelf(band, box.highShelf)
                    case EqBandType.LOW_SHELF:
                        return readShelf(band, box.lowShelf)
                    case EqBandType.BELL: {
                        if (bellIndex === 3) {return}
                        const bell = [box.lowBell, box.midBell, box.highBell][bellIndex++]
                        const {frequency, gain, q, enabled} = bell
                        frequency.setValue(ParameterDecoder.readValue(band.freq))
                        ifDefined(band.Q?.value, value => q.setValue(value))
                        ifDefined(band.gain?.value, value => gain.setValue(value))
                        ifDefined(band.enabled?.value, value => enabled.setValue(value))
                        return
                    }
                    default:
                        console.warn(`Cannot map band type: ${band.type} to Revamp`)
                        return
                }
            })
        })
    }
}