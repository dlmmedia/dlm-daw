import {Coordinates, SelectableLocator} from "@dlm-daw/lib-std"
import {ppqn} from "@dlm-daw/lib-dsp"

import {BoxAdapter} from "@dlm-daw/studio-adapters"

export type TimelineCoordinates = Coordinates<ppqn, number>
export type TimelineSelectableLocator<A extends BoxAdapter> = SelectableLocator<A, ppqn, number>