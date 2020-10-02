import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import {
    NumericFieldComponent,
    SelectFieldComponent,
    TextualFieldComponent
} from './filter-fields';
import { FilterComponent } from './filter/filter.component';
import { RouteFieldValues } from './route-field-values';
import { CheckboxFieldComponent } from './filter-fields/checkbox-field/checkbox-field.component';
import { RadioFieldComponent } from './filter-fields/radio-field/radio-field.component';

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
        MatRadioModule
    ],
    exports: [
        FilterComponent,
    ],
    providers: [
        RouteFieldValues,
    ]
})
export class FiltersModule { }
