import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import {
    NumericFieldComponent,
    SelectFieldComponent,
    TextualFieldComponent,
} from './filter-fields';
import { CheckboxFieldComponent } from './filter-fields/checkbox-field/checkbox-field.component';
import { RadioFieldComponent } from './filter-fields/radio-field/radio-field.component';
import { FilterComponent } from './filter/filter.component';
import { RouteFieldValues } from './route-field-values';

@NgModule({
    declarations: [
        FilterComponent,
        TextualFieldComponent,
        NumericFieldComponent,
        SelectFieldComponent,
        CheckboxFieldComponent,
        RadioFieldComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
    ],
    exports: [FilterComponent],
    providers: [RouteFieldValues],
})
export class FiltersModule {}
