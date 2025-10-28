import {Notifier, Observer, Option, Subscription, Terminable} from "@dlm-daw/lib-std"
import {Editing, PointerField, Vertex} from "@dlm-daw/lib-box"
import {Pointers} from "@dlm-daw/studio-enums"

export class UserEditing implements Terminable {
    readonly #editing: Editing
    readonly #notifier: Notifier<Option<Vertex>>

    #subscription: Option<Subscription> = Option.None
    #pointer: Option<PointerField<Pointers.Editing>> = Option.None

    constructor(editing: Editing) {
        this.#editing = editing
        this.#notifier = new Notifier()
    }

    catchupAndSubscribe(observer: Observer<Option<Vertex>>): Subscription {
        observer(this.get())
        return this.#notifier.subscribe(observer)
    }

    follow(pointer: PointerField<Pointers.Editing>): void {
        this.#pointer = Option.wrap(pointer)
        this.#subscription.ifSome(subscription => subscription.terminate())
        this.#subscription = Option.wrap(pointer
            .catchupAndSubscribe(pointer => this.#notifier.notify(pointer.targetVertex)))
    }

    edit(target: Vertex<Pointers.Editing | Pointers>): void {
        this.#pointer.ifSome(pointer => this.#editing.modify(() => pointer.refer(target)))
    }

    isEditing(vertex: Vertex<Pointers.Editing | Pointers>): boolean {
        return this.#pointer.match({
            none: () => false,
            some: pointer => pointer.targetVertex.contains(vertex)
        })
    }

    get(): Option<Vertex> {return this.#pointer.flatMap(pointer => pointer.targetVertex)}

    clear(): void {this.#pointer.ifSome(pointer => this.#editing.modify(() => pointer.defer()))}

    terminate(): void {
        this.#pointer = Option.None
        this.#subscription.ifSome(subscription => subscription.terminate())
        this.#subscription = Option.None
        this.#notifier.notify(Option.None)
        this.#notifier.terminate()
    }
}