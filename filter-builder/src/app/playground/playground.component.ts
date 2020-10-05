import { ChangeDetectionStrategy, Component, Host } from '@angular/core';
import { combineLatest, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import {
    Filter,
    FilterId,
    FieldId,
    TextualField,
    NumericField,
    SelectField,
    FilterFields,
    FieldValues,
    FieldValueEmitter,
    StringValue,
    NumberValue,
    RouteFieldValues,
    FilterPair,
    CheckboxField,
    BooleanValue,
    RadioField,
} from '../filters';
import { NgDestroyer } from '../utils';

@Component({
    selector: 'app-playground',
    templateUrl: './playground.component.html',
    styleUrls: ['./playground.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        FieldValueEmitter,
        NgDestroyer,
    ],
})
export class PlaygroundComponent {
    public readonly filter: Filter;

    constructor(
        routeFieldValues: RouteFieldValues,
        @Host() fieldValueEmitter: FieldValueEmitter,
        destroyer$: NgDestroyer
    ) {
        const colors$ = of<{ color: string, category: string }[]>([
            { color: 'red', category: 'a' },
            { color: 'green', category: 'a' },
            { color: 'blue', category: 'a' },
            { color: 'purple', category: 'b' },
            { color: 'yellow', category: 'b' },
        ]);

        const categoryPair = new FilterPair(
            new SelectField(new FieldId(2), 'Category', of(['a', 'b', 'c'])), new StringValue('a')
        );

        const depColors$ = combineLatest([
            colors$,
            categoryPair.currentValue.value$
        ]).pipe(
            map(([colors, categoryValue]) => {
                const term = categoryValue.value?.toLowerCase() ?? null;
                return (!!term
                    ? colors.filter(color => color.category === term)
                    : colors).map(color => color.color);
            })
        );

        this.filter = new Filter(new FilterId(1), [
            new FilterPair(
                new TextualField(new FieldId(0), 'Name'),
                new StringValue('text')
            ),
            new FilterPair(
                new NumericField(new FieldId(1), 'Age'),
                new NumberValue(1),
            ),
            categoryPair,
            new FilterPair(
                new SelectField(new FieldId(3), 'Color', depColors$),
                new StringValue(null)
            ),
            new FilterPair(
                new CheckboxField(new FieldId(4), 'Archived'),
                new BooleanValue(null)
            ),
            new FilterPair(
                new RadioField(new FieldId(5), 'Points', ['one', 'two', 'three']),
                new StringValue('two')
            )
        ]);

        fieldValueEmitter.fieldValue.pipe(
            takeUntil(destroyer$)
        ).subscribe(([field, fieldValue]) => {
            const fieldsCopy = FilterFields.copy(this.filter.fields);

            fieldsCopy.setValue(field, fieldValue);
            const values = fieldsCopy.values();
            const serializedValues = FieldValues.serialize(values);

            routeFieldValues.apply(serializedValues);
        });

        routeFieldValues.values(this.filter.fields).pipe(
            takeUntil(destroyer$)
        ).subscribe(fieldValues => {
            this.filter.fields.setValues(fieldValues);
        });
    }
}
