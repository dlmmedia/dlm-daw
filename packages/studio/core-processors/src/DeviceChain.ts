import {Terminable} from "@dlm-daw/lib-std"

export interface DeviceChain extends Terminable {
    invalidateWiring(): void
}