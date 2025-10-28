import {Interpolation, ppqn} from "@dlm-daw/lib-dsp"
import {Generators, Option, unitValue} from "@dlm-daw/lib-std"
import {ValueEventOwnerReader} from "@/ui/timeline/editors/EventOwnerReader.ts"
import {UIValueEvent} from "@/ui/timeline/editors/value/UIValueEvent.ts"

export interface ValueModifyStrategy {
    showOrigin(): boolean
    snapValue(): Option<unitValue>
    readPosition(event: UIValueEvent): ppqn
    readValue(event: UIValueEvent): unitValue
    readInterpolation(event: UIValueEvent): Interpolation
    translateSearch(value: ppqn): ppqn
    isVisible(event: UIValueEvent): boolean
    iterator(searchMin: ppqn, searchMax: ppqn): IteratorObject<UIValueEvent>
    readContentDuration(owner: ValueEventOwnerReader): ppqn
}

export namespace ValueModifyStrategy {
    export const Identity: ValueModifyStrategy = Object.freeze({
        showOrigin: (): boolean => false,
        snapValue: (): Option<unitValue> => Option.None,
        readPosition: (event: UIValueEvent): ppqn => event.position,
        readValue: (event: UIValueEvent): unitValue => event.value,
        readInterpolation: (event: UIValueEvent): Interpolation => event.interpolation,
        translateSearch: (value: ppqn): ppqn => value,
        isVisible: (_event: UIValueEvent): boolean => true,
        iterator: (_searchMin: ppqn, _searchMax: ppqn): IteratorObject<UIValueEvent> => Generators.empty(),
        readContentDuration: (region: ValueEventOwnerReader): ppqn => region.contentDuration
    })
}