import {Dialogs} from "@/ui/components/dialogs.tsx"
import {Result, Validator} from "./validator"

export const NameValidator: Validator<string> = {
    validate: (value: string, match: Result<string>, origin?: Element): void => {
        const trimmed = value.trim()
        if (trimmed.length >= 1 && trimmed.length <= 64) {
            match.success(trimmed)
        } else {
            match.failure?.call(null)
            Dialogs.info({message: "A name must have one to 64 chararacters.", origin: origin}).finally()
        }
    }
}