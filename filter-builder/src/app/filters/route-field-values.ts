import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FieldValues, FilterFields } from './filter';

@Injectable()
export class RouteFieldValues {
    constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

    public values(filterFields: FilterFields): Observable<FieldValues> {
        return this.activatedRoute.queryParams.pipe(
            map((params) => FieldValues.deserialize(filterFields, params)),
        );
    }

    public apply(filterValues: { [id: string]: string }): void {
        this.router.navigate([], { queryParams: filterValues });
    }
}
