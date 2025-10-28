import {ModularAudioOutputBox} from "@dlm-daw/studio-boxes"
import {Pointers} from "@dlm-daw/studio-enums"
import {Arrays} from "@dlm-daw/lib-std"
import {AbstractModuleAdapter} from "../abstract"
import {ModuleAdapter} from "../module"
import {Direction, ModuleConnectorAdapter} from "../connector"
import {BoxAdaptersContext} from "../../BoxAdaptersContext"

export class ModularAudioOutputAdapter extends AbstractModuleAdapter<ModularAudioOutputBox> implements ModuleAdapter {
    readonly #voltageInput: ModuleConnectorAdapter<Pointers.VoltageConnection, Direction.Input>

    constructor(context: BoxAdaptersContext, box: ModularAudioOutputBox) {
        super(context, box)

        this.#voltageInput = ModuleConnectorAdapter.create(context.boxAdapters, box.input, Direction.Input, "Input")
    }

    get voltageInput(): ModuleConnectorAdapter<Pointers.VoltageConnection, Direction.Input> {return this.#voltageInput}

    get inputs(): ReadonlyArray<ModuleConnectorAdapter<Pointers.VoltageConnection, Direction.Input>> {
        return [this.#voltageInput]
    }
    get outputs(): ReadonlyArray<ModuleConnectorAdapter<Pointers.VoltageConnection, Direction.Output>> {
        return Arrays.empty()
    }
}