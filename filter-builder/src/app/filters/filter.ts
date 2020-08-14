import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

export enum FieldType {
    String = 0,
    Number = 1,
    Select = 4,
}

export class StringValue {
    constructor(
        public readonly value: string | null
    ) { }

    public static tryParse(raw: unknown): readonly [StringValue, boolean] {
        return typeof raw === 'string'
            ? [new StringValue(raw), true]
            : [new StringValue(''), false];
    }

    public stringify(): string | null {
        return this.value;
    }
}

export class NumberValue {
    constructor(
        public readonly value: number | null
    ) { }

    public static tryParse(raw: unknown): readonly [NumberValue, boolean] {
        if (typeof raw === 'string') {
            const numericValue = parseInt(raw, 10);
            if (!isNaN(numericValue)) {
                return [new NumberValue(numericValue), true];
            }
        }

        return [new NumberValue(0), false];
    }

    public stringify(): string | null | undefined {
        return this.value?.toString();
    }
}

export type FieldValue =
    | StringValue
    | NumberValue
    ;

class MutableValue<T> {
    public readonly value$: BehaviorSubject<T>;

    public get contents(): T {
        return this.value$.value;
    }

    public set contents(val: T) {
        this.value$.next(val);
    }

    constructor(initValue: T) {
        this.value$ = new BehaviorSubject<T>(initValue);
    }
}

/****************
 * Filter field (Definition)
 ****************/

/**
 * Wrapper over a number value
 */
export class FieldId {
    constructor(public readonly value: number) { }

    public static tryParse(raw: unknown | null | undefined): readonly [FieldId, boolean] {
        if (typeof raw === 'number') {
            return [new FieldId(raw), true];
        }

        if (typeof raw === 'string') {
            const numericValue = parseInt(raw, 10);
            if (!isNaN(numericValue)) {
                return [new FieldId(numericValue), true];
            }
        }

        return [new FieldId(0), false];
    }

    public toString(): string {
        return this.value.toString();
    }

    public valueOf(): number {
        return this.value;
    }
}

const INTERNAL_FIELD_VALUE = Symbol('Access to the mutable field value');

export class StringField {
    public readonly fieldType = FieldType.String;
    public readonly value$: Observable<StringValue>;
    public readonly [INTERNAL_FIELD_VALUE]: MutableValue<StringValue>;

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        value: StringValue,
    ) {
        const mutableValue = new MutableValue(value);
        this[INTERNAL_FIELD_VALUE] = mutableValue;
        this.value$ = mutableValue.value$;
    }
}

export class NumberField {
    public readonly fieldType = FieldType.Number;
    public readonly value$: Observable<NumberValue>;
    public readonly [INTERNAL_FIELD_VALUE]: MutableValue<NumberValue>;

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        value: NumberValue,
    ) {
        const mutableValue = new MutableValue(value);
        this[INTERNAL_FIELD_VALUE] = mutableValue;
        this.value$ = mutableValue.value$;
    }
}

export class SelectField {
    public readonly fieldType = FieldType.Select;
    public readonly value$: Observable<StringValue>;
    public readonly [INTERNAL_FIELD_VALUE]: MutableValue<StringValue>;

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        value: StringValue,
        public readonly items: ReadonlyArray<string>,
    ) {
        const mutableValue = new MutableValue(value);
        this[INTERNAL_FIELD_VALUE] = mutableValue;
        this.value$ = mutableValue.value$;
    }
}

export type Field =
    | StringField
    | NumberField
    | SelectField
    ;

/***************
 * Field Values
 ***************/

export type SerializedFieldValues = { [fieldId: string]: string };

export class FieldValues {
    public readonly items: ReadonlyMap<number, FieldValue>; // TODO:

    constructor(pairs: readonly [FieldId, FieldValue][]) {
        this.items = new Map(pairs.map(([fieldId, value]) => [fieldId.value, value]));
    }

    /**
     * Serializes values to
     * {
     *      1: 'name',
     *      2: '0',
     *      3: 'a,b'
     * }
     * skipping nulls
     */
    public static serialize(fieldValues: FieldValues): SerializedFieldValues {
        const obj: SerializedFieldValues = {};

        for (const [fieldId, value] of fieldValues.items.entries()) {
            const str = value.stringify();
            if (str != null) {
                obj[fieldId] = str;
            }
        }

        return obj;
    }

    public static deserialize(fields: FilterFields, obj: SerializedFieldValues | null | undefined): FieldValues {
        if (obj == null) {
            return new FieldValues([]);
        }

        const rawFieldIds = Object.keys(obj);
        const pairs: [FieldId, FieldValue][] = [];
        for (const rawFieldId of rawFieldIds) {
            const [fieldId, isIdParsed] = FieldId.tryParse(rawFieldId);
            if (!isIdParsed) {
                continue;
            }

            const field = fields.getById(fieldId);

            if (field == null) {
                continue;
            }

            const [parsedValue, isValueParsed] = FieldValues.deserializeValue(field.fieldType, obj[rawFieldId]);
            if (isValueParsed) {
                pairs.push([field.fieldId, parsedValue]);
            }
        }

        return new FieldValues(pairs);
    }

    private static deserializeValue(fieldType: FieldType, value: string | null | undefined): readonly [FieldValue, boolean] {
        switch (fieldType) {
            case FieldType.Select:
            case FieldType.String:
                return StringValue.tryParse(value);
            case FieldType.Number:
                return NumberValue.tryParse(value);
            default:
                const unreachable: never = fieldType;
                throw new Error(`Unexpected type ${unreachable}`);
        }
    }
}

type FilterRow<TField, TValue> = {
    field: TField,
    value: TValue
};

/**
 * Collection of filter fields. A map of fields is under the hood.
 */
export class FilterFields {
    private readonly fieldById: Map<number, Field>;

    constructor(public readonly array: ReadonlyArray<Field>) {
        this.fieldById = new Map<number, Field>(array.map(field => [field.fieldId.value, field]));
    }

    /**
     * Clones the current filter fields
     */
    public static copy(fields: FilterFields): FilterFields {
        const fieldsArray = Array
            .from(fields.fieldById.values())
            .map(field => FilterFields.copyField(field));

        return new FilterFields(fieldsArray);
    }

    /**
     * Clone the field
     */
    private static copyField(field: Field): Field {
        switch (field.fieldType) {
            case FieldType.String:
                return new StringField(field.fieldId, field.name, field[INTERNAL_FIELD_VALUE].contents);
            case FieldType.Number:
                return new NumberField(field.fieldId, field.name, field[INTERNAL_FIELD_VALUE].contents);
            case FieldType.Select:
                return new SelectField(field.fieldId, field.name, field[INTERNAL_FIELD_VALUE].contents, field.items);
            default:
                const unreachable: never = field;
                throw new Error(`Unexpected type ${unreachable}`);
        }
    }

    /**
     * Sets a value to the field by id
     */
    public setValue(fieldId: FieldId, value: FieldValue): void { // TODO: possible pass incorrect value
        const field = this.fieldById.get(fieldId.value);

        if (field == null) {
            return;
        }

        field[INTERNAL_FIELD_VALUE].contents = value;
    }

    /**
     * Gets a field by id. Returns undefined if not found
     */
    public getById(fieldId: FieldId): Field | undefined {
        return this.fieldById.get(fieldId.value);
    }

    /**
     * Sets values bulk
     */
    public setValues(values: FieldValues): void {
        values.items.forEach((value, fieldIdValue) => {
            const field = this.fieldById.get(fieldIdValue);
            if (field == null) {
                return;
            }
            field[INTERNAL_FIELD_VALUE].contents = value;
        });
    }

    /**
     * Returns a field values collection
     */
    public values(): FieldValues {
        return new FieldValues(
            Array.from(this.fieldById.entries())
                .map(([fieldId, fieldValue]) => [new FieldId(fieldId), fieldValue[INTERNAL_FIELD_VALUE].contents])
        );
    }
}

/*********
 * Filter
 *********/

export class FilterId {
    constructor(public readonly value: number) { }

    public toString(): string {
        return this.value.toString();
    }

    public valueOf(): number {
        return this.value;
    }
}

/**
 * Represents a filter
 */
export class Filter {
    public readonly fields: FilterFields;

    constructor(
        public readonly filterId: FilterId,
        fields: ReadonlyArray<Field>
    ) {
        this.fields = new FilterFields(fields);
    }
}

type ExtractFieldValue<T> = T extends { readonly value$: Observable<infer V> } ? V : never;

/**
 * Emits a pair of fieldId and field (like EventEmitter)
 */
@Injectable()
export class FieldValueEmitter {
    private readonly fieldValue$ = new Subject<[FieldId, FieldValue]>();
    public readonly fieldValue: Observable<[FieldId, FieldValue]> = this.fieldValue$;

    /**
     * Emit a field and a value with the corresponding type being inferred from the one
     */
    public emit<T extends Field>(field: T, fieldValue: ExtractFieldValue<T>): void {
        this.fieldValue$.next([field.fieldId, fieldValue]);
    }
}

/*
    {
        fieldId: 1,
        fields: [
            {
                id,
                name, // unique ?
                [hint]
                [checkbox],
                order

                value: boolean
            },
            {
                select,
                items,
                defaultValue
            },
            {
                [{ id, name, initValue: T }, { value: T }]
            }
        ]
    }
*/
