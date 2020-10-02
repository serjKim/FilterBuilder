import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { FilterPair, SelectField, StringValue, Field, FieldValueEmitter } from '../../filter';

@Component({
    selector: 'app-select-field',
    templateUrl: './select-field.component.html',
    styleUrls: ['./select-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent {
    public field!: SelectField;
    public value$!: Observable<StringValue>;

    @Input()
    public set filterPair(pair: FilterPair<Field>) {
        if (!pair.isSelect()) {
            throw new Error('Expected select field');
        }
        this.field = pair.field;
        this.value$ = pair.currentValue.value$;
    }

    constructor(private fieldValueEmitter: FieldValueEmitter) { }

    public onSelectChange(newValue: string): void {
        this.fieldValueEmitter.emit(this.field, new StringValue(newValue));
    }
}
