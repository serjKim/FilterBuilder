import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

export enum FieldType {
    Textual = 0,
    Numeric = 1,
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

const FIELD_VALUE = Symbol('Defines a field value (brand)');

interface FieldDefinition<TValue extends FieldValue> {
    readonly fieldType: FieldType;
    readonly [FIELD_VALUE]: TValue;
}

export class TextualField implements FieldDefinition<StringValue> { // TODO: rename to TextField
    public readonly fieldType = FieldType.Textual;
    public readonly [FIELD_VALUE] = new StringValue('');

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
    ) { }
}

export class NumericField implements FieldDefinition<NumberValue> {
    public readonly fieldType = FieldType.Numeric;
    public readonly [FIELD_VALUE] = new NumberValue(0);

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
    ) { }
}

export class SelectField implements FieldDefinition<StringValue> {
    public readonly fieldType = FieldType.Select;
    public readonly [FIELD_VALUE] = new StringValue('');

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        public readonly items: ReadonlyArray<string>,
    ) { }
}

export type Field =
    | TextualField
    | NumericField
    | SelectField
    ;

const copyField = (field: Field): Field => {
    switch (field.fieldType) {
        case FieldType.Textual:
            return new TextualField(field.fieldId, field.name);
        case FieldType.Numeric:
            return new NumericField(field.fieldId, field.name);
        case FieldType.Select:
            return new SelectField(field.fieldId, field.name, field.items);
        default:
            const unreachable: never = field;
            throw new Error(`Unexpected type ${unreachable}`);
    }
};

/***************
 * Field Values
 ***************/

export type SerializedFieldValues = { [fieldId: string]: string };

export class FieldValues {
    public readonly items: ReadonlyMap<number, FieldValue>;

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
            case FieldType.Textual:
                return StringValue.tryParse(value);
            case FieldType.Numeric:
                return NumberValue.tryParse(value);
            default:
                const unreachable: never = fieldType;
                throw new Error(`Unexpected type ${unreachable}`);
        }
    }
}

/**
 * Current value (reactive)
 */

const INTERNAL_VALUE = Symbol('Access to the mutable value');

class CurrentValue<T> {
    private readonly subject$: BehaviorSubject<T>;
    public readonly value$: Observable<T>;

    public get [INTERNAL_VALUE](): T {
        return this.subject$.value;
    }

    public set [INTERNAL_VALUE](val: T) {
        this.subject$.next(val);
    }

    constructor(initValue: T) {
        this.value$ = this.subject$ = new BehaviorSubject<T>(initValue);
    }

    public static copyCurrentValue<T>(cv: CurrentValue<T>): CurrentValue<T> {
        return new CurrentValue<T>(cv[INTERNAL_VALUE]);
    }
}

type ExtractValueType<T> = T extends FieldDefinition<infer V> ? V : never;

/**
 * Represents a pair of field definition + mutable value
 */
export class FilterPair<T> {
    public readonly currentValue: CurrentValue<ExtractValueType<T>>;

    constructor(
        public readonly field: T,
        initValue: ExtractValueType<T>
    ){
        this.currentValue = new CurrentValue(initValue);
    }
}

/**
 * Collection of pairs. A map of pairs by fieldId is under the hood.
 */
export class FilterFields {
    private readonly pairById: Map<number, FilterPair<Field>>;

    constructor(public readonly pairs: ReadonlyArray<FilterPair<Field>>) {
        this.pairById = new Map<number, FilterPair<Field>>(pairs.map(pair => [pair.field.fieldId.value, pair]));
    }

    /**
     * Clones the current filter fields
     */
    public static copy(fields: FilterFields): FilterFields {
        const pairsArray = Array
            .from(fields.pairById.values())
            .map(pair => FilterFields.copyPair(pair));

        return new FilterFields(pairsArray);
    }

    /**
     * Clone the pair
     */
    private static copyPair(pair: FilterPair<Field>): FilterPair<Field> {
        const fieldCopy = copyField(pair.field);
        const currentValueCopy = CurrentValue.copyCurrentValue(pair.currentValue);
        return new FilterPair(fieldCopy, currentValueCopy[INTERNAL_VALUE]);
    }

    /**
     * Sets a value to the corresponding field, inferring from the one
     */
    public setValue<T extends Field>(field: T, fieldValue: ExtractValueType<T>): void {
        const pair = this.pairById.get(field.fieldId.value);

        if (pair == null) {
            return;
        }

        pair.currentValue[INTERNAL_VALUE] = fieldValue;
    }

    /**
     * Gets a field by id. Returns undefined if not found
     */
    public getById(fieldId: FieldId): Field | undefined {
        return this.pairById.get(fieldId.value)?.field;
    }

    /**
     * Sets values bulk
     */
    public setValues(values: FieldValues): void {
        values.items.forEach((value, fieldIdValue) => {
            const pair = this.pairById.get(fieldIdValue);
            if (pair == null) {
                return;
            }
            pair.currentValue[INTERNAL_VALUE] = value;
        });
    }

    /**
     * Returns a field values collection
     */
    public values(): FieldValues {
        return new FieldValues(
            Array.from(this.pairById.entries())
                .map(([fieldId, pair]) => [new FieldId(fieldId), pair.currentValue[INTERNAL_VALUE]])
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
        pairs: readonly FilterPair<Field>[],
    ) {
        this.fields = new FilterFields(pairs);
    }
}

/**
 * Emits a pair of field definition and field value (like EventEmitter)
 */
@Injectable()
export class FieldValueEmitter {
    private readonly fieldValue$ = new Subject<[Field, FieldValue]>();
    public readonly fieldValue: Observable<[Field, FieldValue]> = this.fieldValue$;

    /**
     * Emit a field and a value with the corresponding type being inferred from the one
     */
    public emit<T extends Field>(field: T, fieldValue: ExtractValueType<T>): void {
        this.fieldValue$.next([field, fieldValue]);
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
