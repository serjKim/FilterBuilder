import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TextualFieldComponent } from './textual-field.component';

describe('TextualFieldComponent', () => {
    let component: TextualFieldComponent;
    let fixture: ComponentFixture<TextualFieldComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TextualFieldComponent],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TextualFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
