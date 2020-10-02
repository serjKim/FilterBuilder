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
            map(params => FieldValues.deserialize(filterFields, params))
        );
    }

    public apply(filterValues: { [id: string]: string }): void {
        this.router.navigate([], { queryParams: filterValues });
    }
}
