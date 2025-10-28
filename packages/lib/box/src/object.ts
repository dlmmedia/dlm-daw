import {Field, FieldConstruct, FieldKey, Fields} from "./field"
import {UnreferenceableType} from "./pointer"
import {
    asDefined,
    DataInput,
    DataOutput,
    isDefined,
    isRecord,
    JSONValue,
    Maybe,
    Option,
    Optional,
    panic,
    safeExecute
} from "@dlm-daw/lib-std"
import {Serializer} from "./serializer"
import {VertexVisitor} from "./vertex"

export abstract class ObjectField<FIELDS extends Fields> extends Field<UnreferenceableType, FIELDS> {
    readonly #fields: FIELDS

    protected constructor(construct: FieldConstruct<UnreferenceableType>) {
        super(construct)

        this.#fields = this.initializeFields()
    }

    protected abstract initializeFields(): FIELDS

    accept<RETURN>(visitor: VertexVisitor<RETURN>): Maybe<RETURN> {
        return safeExecute(visitor.visitObjectField, this)
    }

    fields(): ReadonlyArray<Field> {return Object.values(this.#fields)}
    record(): Readonly<Record<string, Field>> {return this.#fields}
    getField<K extends keyof FIELDS>(key: K): FIELDS[K] {return asDefined(this.#fields[key])}
    optField<K extends keyof FIELDS>(key: K): Option<FIELDS[K]> {return Option.wrap(this.#fields[key])}

    read(input: DataInput): void {Serializer.readFields(input, this.#fields)}
    write(output: DataOutput): void {Serializer.writeFields(output, this.#fields)}

    toJSON(): Optional<JSONValue> {
        return Object.entries(this.#fields).reduce((result: Record<string, Optional<JSONValue>>, [key, field]) => {
            result[key] = field.toJSON()
            return result
        }, {})
    }

    fromJSON(record: JSONValue): void {
        if (isRecord(record)) {
            Object.entries(record).forEach(([key, value]) => {
                const field: Field = this.#fields[parseInt(key) as FieldKey]
                if (isDefined(value)) {
                    field.fromJSON(value)
                }
            })
        } else {
            return panic("Type mismatch")
        }
    }
}