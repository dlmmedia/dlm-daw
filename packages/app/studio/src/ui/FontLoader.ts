import {Fonts} from "@/ui/Fonts"
import {loadFont} from "@dlm-daw/lib-dom"
import {Lazy} from "@dlm-daw/lib-std"

export class FontLoader {
    @Lazy
    static async load() {
        return Promise.allSettled([
            loadFont(Fonts.Rubik), loadFont(Fonts.OpenSans)
        ])
    }
}