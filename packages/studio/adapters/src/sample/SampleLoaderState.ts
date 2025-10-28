import {unitValue} from "@dlm-daw/lib-std"

export type SampleLoaderState =
    | { readonly type: "idle" }
    | { readonly type: "record" }
    | { readonly type: "progress", progress: unitValue }
    | { readonly type: "error", readonly reason: string }
    | { readonly type: "loaded" }