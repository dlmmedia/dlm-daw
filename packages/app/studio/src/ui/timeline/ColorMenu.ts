import {MenuItem} from "@/ui/model/menu-item"
import {TrackType} from "@dlm-daw/studio-adapters"
import {Procedure} from "@dlm-daw/lib-std"
import {ColorCodes} from "@dlm-daw/studio-core"

export namespace ColorMenu {
    const Colors: ReadonlyArray<{ label: string, hue: number }> = [
        {label: "Blue", hue: ColorCodes.forTrackType(TrackType.Audio)},
        {label: "Orange", hue: ColorCodes.forTrackType(TrackType.Notes)},
        {label: "Green", hue: ColorCodes.forTrackType(TrackType.Value)},
        {label: "Red", hue: 8.0},
        {label: "Purple", hue: 322.0},
        {label: "Yellow", hue: 60.0}
    ].sort((a, b) => a.hue - b.hue)

    export const createItem = (procedure: Procedure<number>) => MenuItem.default({label: "Color"})
        .setRuntimeChildrenProcedure(parent => parent
            .addMenuItem(...Colors.map(({label, hue}) => MenuItem.default({label})
                .setTriggerProcedure(() => procedure(hue)))))
}