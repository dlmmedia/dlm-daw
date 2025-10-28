import {Observer, Subscription} from "@dlm-daw/lib-std"
import {Modifier} from "@/ui/timeline/Modifier.ts"

export interface ObservableModifier extends Modifier {
    subscribeUpdate(observer: Observer<void>): Subscription
}