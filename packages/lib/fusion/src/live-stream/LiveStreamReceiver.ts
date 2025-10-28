import {
    Arrays,
    assert,
    ByteArrayInput,
    float,
    int,
    isDefined,
    Option,
    panic,
    Procedure,
    SortedSet,
    Subscription,
    Terminable
} from "@dlm-daw/lib-std"
import {Address} from "@dlm-daw/lib-box"
import {AnimationFrame} from "@dlm-daw/lib-dom"
import {Communicator, Messenger} from "@dlm-daw/lib-runtime"
import {PackageType} from "./PackageType"
import {Subscribers} from "./Subscribers"
import {Protocol} from "./Protocol"
import {Lock} from "./Lock"
import {Flags} from "./Flags"

interface Package<T> extends Terminable {
    dispatch(address: Address, input: ByteArrayInput): void
    subscribe(address: Address, procedure: Procedure<T>): Subscription
}

class FloatPackage implements Package<float> {
    readonly subscribers = new Subscribers<Procedure<float>>()

    dispatch(address: Address, input: ByteArrayInput): void {
        const value = input.readFloat()
        this.subscribers.getOrNull(address)?.forEach(procedure => procedure(value))
    }
    subscribe(address: Address, procedure: Procedure<float>): Subscription {
        return this.subscribers.subscribe(address, procedure)
    }
    terminate(): void {this.subscribers.terminate()}
}

class IntegerPackage implements Package<int> {
    readonly subscribers = new Subscribers<Procedure<int>>()

    dispatch(address: Address, input: ByteArrayInput): void {
        const value = input.readInt()
        this.subscribers.getOrNull(address)?.forEach(procedure => procedure(value))
    }
    subscribe(address: Address, procedure: Procedure<int>): Subscription {
        return this.subscribers.subscribe(address, procedure)
    }
    terminate(): void {this.subscribers.terminate()}
}

type ArrayTypes = Float32Array | Int32Array | Int8Array

type ArrayEntry<T extends ArrayTypes> = { address: Address, array: T }

abstract class ArrayPackage<T extends ArrayTypes> implements Package<T> {
    readonly subscribers = new Subscribers<Procedure<T>>()
    readonly #arrays: SortedSet<Address, ArrayEntry<T>> = Address.newSet<ArrayEntry<T>>(entry => entry.address)

    abstract create(length: int): T
    abstract read(input: ByteArrayInput, array: T, length: int): void

    dispatch(address: Address, input: ByteArrayInput): void {
        const length = input.readInt()
        const entry = this.#arrays.getOrNull(address)
        let array: T
        if (isDefined(entry)) {
            array = entry.array
        } else {
            array = this.create(length)
            this.#arrays.add({address, array})
        }
        this.read(input, array, length)
        this.subscribers.getOrNull(address)?.forEach(procedure => procedure(array))
    }

    subscribe(address: Address, procedure: Procedure<T>): Subscription {
        const subscription = this.subscribers.subscribe(address, procedure)
        return {
            terminate: () => {
                subscription.terminate()
                if (this.subscribers.isEmpty(address) && this.#arrays.hasKey(address)) {
                    this.#arrays.removeByKey(address)
                }
            }
        }
    }

    terminate(): void {this.subscribers.terminate()}
}

class FloatArrayPackage extends ArrayPackage<Float32Array> {
    create(length: number): Float32Array {return new Float32Array(length)}
    read(input: ByteArrayInput, array: Float32Array, length: number): void {
        for (let i = 0; i < length; i++) {array[i] = input.readFloat()}
    }
}

class IntegerArrayPackage extends ArrayPackage<Int32Array> {
    create(length: number): Int32Array {return new Int32Array(length)}
    read(input: ByteArrayInput, array: Int32Array, length: number): void {
        for (let i = 0; i < length; i++) {array[i] = input.readInt()}
    }
}

class ByteArrayPackage extends ArrayPackage<Int8Array> {
    create(length: number): Int8Array {return new Int8Array(length)}
    read(input: ByteArrayInput, array: Int8Array, _length: number): void {
        input.readBytes(array)
    }
}

export class LiveStreamReceiver implements Terminable {
    static ID: int = 0 | 0

    readonly #float = new FloatPackage()
    readonly #integer = new IntegerPackage()
    readonly #floats = new FloatArrayPackage()
    readonly #integers = new IntegerArrayPackage()
    readonly #bytes = new ByteArrayPackage()
    readonly #packages: Array<Package<unknown>> = []
    readonly #procedures: Array<Procedure<ByteArrayInput>> = []
    readonly #id: int

    #optLock: Option<Int8Array> = Option.None
    #memory: Option<ByteArrayInput> = Option.None

    #structureVersion = -1
    #connected = false

    constructor() {
        this.#id = LiveStreamReceiver.ID++
        this.#packages[PackageType.Float] = this.#float
        this.#packages[PackageType.FloatArray] = this.#floats
        this.#packages[PackageType.Integer] = this.#integer
        this.#packages[PackageType.IntegerArray] = this.#integers
        this.#packages[PackageType.ByteArray] = this.#bytes
    }

    connect(messenger: Messenger): Terminable {
        assert(!this.#connected, "Already connected")
        this.#connected = true
        return Terminable.many(
            {terminate: () => {this.#disconnect()}},
            Communicator.executor<Protocol>(messenger, {
                sendShareLock: (lock: SharedArrayBuffer) => this.#optLock = Option.wrap(new Int8Array(lock)),
                sendUpdateData: (data: ArrayBufferLike) => this.#memory = Option.wrap(new ByteArrayInput(data)),
                sendUpdateStructure: (structure: ArrayBufferLike) => this.#updateStructure(new ByteArrayInput(structure))
            }),
            AnimationFrame.add(() => this.#dispatch())
        )
    }

    #disconnect(): void {
        this.#memory = Option.None
        this.#optLock = Option.None
        this.#structureVersion = -1
        this.#connected = false
        Arrays.clear(this.#procedures)
        this.#float.terminate()
        this.#floats.terminate()
        this.#integer.terminate()
        this.#integers.terminate()
        this.#bytes.terminate()
    }

    subscribeFloat(address: Address, procedure: Procedure<int>): Subscription {
        return this.#float.subscribe(address, procedure)
    }

    subscribeInteger(address: Address, procedure: Procedure<float>): Subscription {
        return this.#integer.subscribe(address, procedure)
    }

    subscribeFloats(address: Address, procedure: Procedure<Float32Array>): Subscription {
        return this.#floats.subscribe(address, procedure)
    }

    subscribeIntegers(address: Address, procedure: Procedure<Int32Array>): Subscription {
        return this.#integers.subscribe(address, procedure)
    }

    subscribeByteArray(address: Address, procedure: Procedure<Int8Array>): Subscription {
        return this.#bytes.subscribe(address, procedure)
    }

    terminate(): void {this.#disconnect()}

    #dispatch(): void {
        if (this.#optLock.isEmpty() || this.#memory.isEmpty()) {return}
        const lock = this.#optLock.unwrap()
        if (Atomics.load(lock, 0) === Lock.READ) {
            const byteArrayInput = this.#memory.unwrap()
            this.#dispatchData(byteArrayInput)
            byteArrayInput.position = 0
            Atomics.store(lock, 0, Lock.WRITE)
        }
    }

    #updateStructure(input: ByteArrayInput): void {
        Arrays.clear(this.#procedures)
        this.#parseStructure(input)
    }

    #dispatchData(input: ByteArrayInput): boolean {
        let version = input.readInt()
        if (version !== this.#structureVersion) {
            // we simply skip and await the latest version soon enough
            return false
        }
        if (input.readInt() !== Flags.START) {throw new Error("stream is broken (no start flag)")}
        for (const procedure of this.#procedures) {procedure(input)}
        if (input.readInt() !== Flags.END) {throw new Error("stream is broken (no end flag)")}
        return true
    }

    #parseStructure(input: ByteArrayInput): void {
        if (input.readInt() !== Flags.ID) {throw new Error("no valid id")}
        const version = input.readInt()
        if (version <= this.#structureVersion) {
            return panic("Invalid version. new: " + version + `, was: ${this.#structureVersion}, id: ${this.#id}`)
        }
        this.#structureVersion = version
        const n = input.readInt()
        for (let i = 0; i < n; i++) {
            const address = Address.read(input)
            const chunk = this.#packages[input.readByte() as PackageType]
            this.#procedures.push(input => chunk.dispatch(address, input))
        }
    }
}