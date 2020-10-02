import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**************
 * Field Value
 **************/

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

export class BooleanValue {
    constructor(
        public readonly value: boolean | null
    ) {}

    public static tryParse(raw: unknown): readonly [BooleanValue, boolean] {
        if (typeof raw === 'string') {
            if (raw === 'false') {
                return [new BooleanValue(false), true];
            } else if (raw === 'true') {
                return [new BooleanValue(true), true];
            }
        }

        if (typeof raw === 'boolean') {
            return [new BooleanValue(raw), true];
        }

        return [new BooleanValue(false), false];
    }

    public stringify(): string | null | undefined {
        return this.value?.toString();
    }
}

export type FieldValue =
    | StringValue
    | NumberValue
    | BooleanValue
    ;

/****************************
 * Filter field (Definition)
 ****************************/

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

export enum FieldType {
    Textual = 0,
    Numeric = 1,
    Select = 4,
    Checkbox = 5,
    Radio = 6,
}

const FIELD_BRAND = Symbol('Defines a field value type (brand)');

interface FieldDefinition<FT extends FieldType, TValue extends FieldValue> {
    readonly fieldType: FT;
    readonly [FIELD_BRAND]: TValue;
}

type EnsureField<T> = T extends FieldDefinition<infer FT, infer V>
    ? FT extends FieldType
        ? V extends FieldValue
            ? T
            : never
        : never
    : never;

type ExtractFieldValue<T> = T extends FieldDefinition<infer FT, infer V> ? V : never;

export class TextualField implements FieldDefinition<FieldType.Textual, StringValue> {
    public readonly fieldType = FieldType.Textual;
    public readonly [FIELD_BRAND] = new StringValue('');

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
    ) { }
}

export class NumericField implements FieldDefinition<FieldType.Numeric, NumberValue> {
    public readonly fieldType = FieldType.Numeric;
    public readonly [FIELD_BRAND] = new NumberValue(0);

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
    ) { }
}

export class SelectField implements FieldDefinition<FieldType.Select, StringValue> {
    public readonly fieldType = FieldType.Select;
    public readonly [FIELD_BRAND] = new StringValue('');

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        public readonly items$: Observable<readonly string[]>,
    ) { }
}

export class CheckboxField implements FieldDefinition<FieldType.Checkbox, BooleanValue> {
    public readonly fieldType = FieldType.Checkbox;
    public readonly [FIELD_BRAND] = new BooleanValue(null);

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
    ) { }
}

export class RadioField implements FieldDefinition<FieldType.Radio, StringValue> {
    public readonly fieldType = FieldType.Radio;
    public readonly [FIELD_BRAND] = new StringValue('');

    constructor(
        public readonly fieldId: FieldId,
        public readonly name: string,
        public readonly options: ReadonlyArray<string>
    ) { }
}

export type Field =
    | TextualField
    | NumericField
    | SelectField
    | CheckboxField
    | RadioField
    ;

const copyField = (field: Field): Field => {
    switch (field.fieldType) {
        case FieldType.Textual:
            return new TextualField(field.fieldId, field.name);
        case FieldType.Numeric:
            return new NumericField(field.fieldId, field.name);
        case FieldType.Select:
            return new SelectField(field.fieldId, field.name, field.items$);
        case FieldType.Checkbox:
            return new CheckboxField(field.fieldId, field.name);
        case FieldType.Radio:
            return new RadioField(field.fieldId, field.name, field.options);
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
            case FieldType.Radio:
                return StringValue.tryParse(value);
            case FieldType.Numeric:
                return NumberValue.tryParse(value);
            case FieldType.Checkbox:
                return BooleanValue.tryParse(value);
            default:
                const unreachable: never = fieldType;
                throw new Error(`Unexpected type ${unreachable}`);
        }
    }
}

/**
 * Current value (reactive)
 */

const INTERNAL_CURRENT_VALUE = Symbol('Access to the mutable value');

class CurrentValue<T> {
    private readonly subject$: BehaviorSubject<T>;
    public readonly value$: Observable<T>;

    public get [INTERNAL_CURRENT_VALUE](): T {
        return this.subject$.value;
    }

    public set [INTERNAL_CURRENT_VALUE](val: T) {
        this.subject$.next(val);
    }

    constructor(initValue: T) {
        this.value$ = this.subject$ = new BehaviorSubject<T>(initValue);
    }

    public static copyCurrentValue<T>(cv: CurrentValue<T>): CurrentValue<T> {
        return new CurrentValue<T>(cv[INTERNAL_CURRENT_VALUE]);
    }
}

/**
 * Represents a pair of field definition + field value
 */
export class FilterPair<T> {
    public readonly currentValue: CurrentValue<ExtractFieldValue<T>>;

    constructor(
        public readonly field: EnsureField<T>,
        initValue: ExtractFieldValue<T>
    ){
        this.currentValue = new CurrentValue(initValue);
    }

    public isTextual(): this is FilterPair<TextualField> {
        return this.field.fieldType === FieldType.Textual;
    }

    public isNumeric(): this is FilterPair<NumericField> {
        return this.field.fieldType === FieldType.Numeric;
    }

    public isSelect(): this is FilterPair<SelectField> {
        return this.field.fieldType === FieldType.Select;
    }

    public isCheckbox(): this is FilterPair<CheckboxField> {
        return this.field.fieldType === FieldType.Checkbox;
    }

    public isRadio(): this is FilterPair<RadioField> {
        return this.field.fieldType === FieldType.Radio;
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
        return new FilterPair(fieldCopy, currentValueCopy[INTERNAL_CURRENT_VALUE]);
    }

    /**
     * Sets a value by field
     */
    public setValue<T extends Field>(field: T, fieldValue: ExtractFieldValue<T>): void {
        const pair = this.pairById.get(field.fieldId.value);

        if (pair == null) {
            return;
        }

        pair.currentValue[INTERNAL_CURRENT_VALUE] = fieldValue;
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
            pair.currentValue[INTERNAL_CURRENT_VALUE] = value;
        });
    }

    /**
     * Returns a field values collection
     */
    public values(): FieldValues {
        return new FieldValues(
            Array.from(this.pairById.entries())
                .map(([fieldId, pair]) => [new FieldId(fieldId), pair.currentValue[INTERNAL_CURRENT_VALUE]])
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
    public emit<T extends Field>(field: T, fieldValue: ExtractFieldValue<T>): void {
        this.fieldValue$.next([field, fieldValue]);
    }
}
