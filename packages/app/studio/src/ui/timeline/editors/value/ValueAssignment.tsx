import {AutomatableParameterFieldAdapter, DeviceBoxAdapter} from "@dlm-daw/studio-adapters"

export type ValueAssignment = {
    device?: DeviceBoxAdapter
    adapter: AutomatableParameterFieldAdapter
}