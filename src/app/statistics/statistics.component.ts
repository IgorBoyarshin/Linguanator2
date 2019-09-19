import { Component } from '@angular/core';

import { Observable, of, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { DataProviderFactoryService } from '../providers/data-provider-factory.service';
import { StatisticsUser } from '../statistics-user.model';


@Component({
  selector: 'statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent {
    public users: Observable<StatisticsUser[]>;

    constructor(
        private dataProviderFactory: DataProviderFactoryService
    ) {
        this.users = this.dataProviderFactory.dataProviderInUse().retrieveStatisticsUsers();
    }
}
