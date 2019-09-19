import { Component } from '@angular/core';

import { Observable, of, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { DataProviderFactoryService } from '../providers/data-provider-factory.service';
import { StatisticsUser } from '../statistics-user.model';
import { StatisticsLanguage } from '../statistics-language.model';


@Component({
  selector: 'statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent {
    public users: Observable<StatisticsUser[]>;
    public languages: Observable<StatisticsLanguage[]>;

    // [(ngModel)]
    public newLanguageName: string;

    // We have a separate boolean variable because we want the text to remain
    // there for the whole duration of the fade-out animation.
    public errorDescription: string = "stuff";
    public displayErrorDescription: boolean = false;

    constructor(
        private dataProviderFactory: DataProviderFactoryService
    ) {
        this.reloadUsers();
        this.reloadLanguages();
    }

    private reloadLanguages() {
        this.languages = this.dataProviderFactory.dataProviderInUse().retrieveStatisticsLanguages();
    }

    private reloadUsers() {
        this.users = this.dataProviderFactory.dataProviderInUse().retrieveStatisticsUsers();
    }

    public submitNewLanguage() {
        this.dataProviderFactory.dataProviderInUse().addLanguage(this.newLanguageName).subscribe(_ => {
            this.reloadLanguages();
        }, err => {
            switch (err.error.code) {
                case 'ERR_DUPLICATE':
                    this.errorDescription = 'Such language already exists!';
                    this.displayErrorDescription = true;
                    setTimeout(() => this.displayErrorDescription = false, 3000);
                    break;
                case 'ERR_UNKNOWN':
                    this.errorDescription = 'Unknown error...';
                    this.displayErrorDescription = true;
                    setTimeout(() => this.displayErrorDescription = false, 3000);
                    console.error('Unknown error...');
                    break;
            }
        });
    }

    public canSubmitNewLanguage(): boolean {
        return true;
    }

    public canDiscardNewLanguage(): boolean {
        return true;
    }
}
