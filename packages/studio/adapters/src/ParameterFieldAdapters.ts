import {Option, SortedSet, Terminable} from "@dlm-daw/lib-std"
import {Address} from "@dlm-daw/lib-box"
import {AutomatableParameterFieldAdapter} from "./AutomatableParameterFieldAdapter"

export class ParameterFieldAdapters {
    readonly #set: SortedSet<Address, AutomatableParameterFieldAdapter>

    constructor() {
        this.#set = Address.newSet<AutomatableParameterFieldAdapter>(adapter => adapter.field.address)
    }

    register(adapter: AutomatableParameterFieldAdapter): Terminable {
        this.#set.add(adapter)
        return {terminate: () => this.#set.removeByValue(adapter)}
    }

    get(address: Address): AutomatableParameterFieldAdapter {return this.#set.get(address)}
    opt(address: Address): Option<AutomatableParameterFieldAdapter> {return this.#set.opt(address)}
}