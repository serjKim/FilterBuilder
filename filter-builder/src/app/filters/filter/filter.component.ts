import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FieldType, Filter } from '../filter';

@Component({
    selector: 'app-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterComponent implements OnInit {
    @Input()
    public filter: Filter | null = null;

    public readonly fieldType = FieldType;

    constructor() { }

    ngOnInit(): void {
    }
}
