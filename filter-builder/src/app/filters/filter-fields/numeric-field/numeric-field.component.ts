import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterPair, NumericField, NumberValue, Field, FieldValueEmitter } from '../../filter';

@Component({
    selector: 'app-numeric-field',
    templateUrl: './numeric-field.component.html',
    styleUrls: ['./numeric-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumericFieldComponent {
    public field!: NumericField;
    public value$!: Observable<NumberValue>;

    @Input()
    public set filterPair(pair: FilterPair<Field>) {
        if (!pair.isNumeric()) {
            throw new Error('Expected textual field');
        }
        this.field = pair.field;
        this.value$ = pair.currentValue.value$;
    }

    constructor(private fieldValueEmitter: FieldValueEmitter) { }

    public onNumberChange(newValue: number): void {
        this.fieldValueEmitter.emit(this.field, new NumberValue(newValue));
    }
}
