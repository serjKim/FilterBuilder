import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Field, FieldValueEmitter, FilterPair, RadioField, StringValue } from '../../filter';

@Component({
    selector: 'app-radio-field',
    templateUrl: './radio-field.component.html',
    styleUrls: ['./radio-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioFieldComponent {
    public field!: RadioField;
    public value$!: Observable<StringValue>;

    @Input()
    public set filterPair(pair: FilterPair<Field>) {
        if (!pair.isRadio()) {
            throw new Error('Expected radio field');
        }
        this.field = pair.field;
        this.value$ = pair.currentValue.value$;
    }

    constructor(private fieldValueEmitter: FieldValueEmitter) {}

    public onRadioChange(newValue: string): void {
        this.fieldValueEmitter.emit(this.field, new StringValue(newValue));
    }
}
