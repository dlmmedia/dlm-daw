import {Terminable, UUID} from "@dlm-daw/lib-std"
import {Addressable, Box} from "@dlm-daw/lib-box"

export interface BoxAdapter extends Addressable, Terminable {
    get box(): Box
    get uuid(): UUID.Bytes
}