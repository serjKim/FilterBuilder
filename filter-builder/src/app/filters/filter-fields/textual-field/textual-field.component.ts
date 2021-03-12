import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Field, FieldValueEmitter, FilterPair, StringValue, TextualField } from '../../filter';

@Component({
    selector: 'app-textual-field',
    templateUrl: './textual-field.component.html',
    styleUrls: ['./textual-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextualFieldComponent {
    public field!: TextualField;
    public value$!: Observable<StringValue>;

    @Input()
    public set filterPair(pair: FilterPair<Field>) {
        if (!pair.isTextual()) {
            throw new Error('Expected textual field');
        }
        this.field = pair.field;
        this.value$ = pair.currentValue.value$;
    }

    @Output()
    public stringValueChange = new EventEmitter<string>();

    constructor(private fieldValueEmitter: FieldValueEmitter) {}

    public onStringChange(value: string): void {
        this.fieldValueEmitter.emit(this.field, new StringValue(value));
    }
}
