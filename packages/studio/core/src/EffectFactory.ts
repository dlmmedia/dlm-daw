import {EffectPointerType, IconSymbol} from "@dlm-daw/studio-adapters"
import {Field} from "@dlm-daw/lib-box"
import {int} from "@dlm-daw/lib-std"
import {Project} from "./project/Project"
import {EffectBox} from "./EffectBox"

export interface EffectFactory {
    get defaultName(): string
    get defaultIcon(): IconSymbol
    get description(): string
    get separatorBefore(): boolean
    get type(): "audio" | "midi"

    create(project: Project, unit: Field<EffectPointerType>, index: int): EffectBox
}