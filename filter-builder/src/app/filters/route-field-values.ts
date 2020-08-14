import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { FieldValues, FilterFields } from './filter';
import { Observable } from 'rxjs';

@Injectable()
export class RouteFieldValues {
    constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    }

    public values(filterFields: FilterFields): Observable<FieldValues> {
        return this.activatedRoute.queryParams.pipe(
            map(params => {
                /*
                    ?1=text
                    &2=1
                    &3=a
                    &4=...
                    &5=...

                    Fields -> FieldValues
                */
                return FieldValues.deserialize(filterFields, params);
            })
        );
    }

    public apply(filterValues: { [id: string]: string }): void {
        this.router.navigate([], { queryParams: filterValues });
    }
}
