import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { BooleanValue, CheckboxField, Field, FieldValueEmitter, FilterPair } from '../../filter';

@Component({
  selector: 'app-checkbox-field',
  templateUrl: './checkbox-field.component.html',
  styleUrls: ['./checkbox-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckboxFieldComponent{
    public field!: CheckboxField;
    public value$!: Observable<BooleanValue>;

    @Input()
    public set filterPair(pair: FilterPair<Field>) {
        if (!pair.isCheckbox()) {
            throw new Error('Expected checkbox field');
        }
        this.field = pair.field;
        this.value$ = pair.currentValue.value$;
    }

    constructor(private fieldValueEmitter: FieldValueEmitter) { }

    public onCheckboxChange(newValue: boolean): void {
        this.fieldValueEmitter.emit(this.field, new BooleanValue(newValue));
    }
}
