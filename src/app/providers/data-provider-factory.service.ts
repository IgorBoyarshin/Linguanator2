import { HttpClient } from '@angular/common/http';

import { Injectable } from '@angular/core';

import { DataProvider } from './data-provider';
import { StaticDataProvider } from './static-data-provider';
import { HttpDataProvider } from './http-data-provider';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class DataProviderFactoryService {
    constructor(private http: HttpClient, private authService: AuthService) {}

    private dataProvider: DataProvider;

    dataProviderInUse(): DataProvider {
        if (!this.dataProvider) {
            // DataProvider to be used throughout the application is set here
            // this.dataProvider = new StaticDataProvider();
            this.dataProvider = new HttpDataProvider(this.http, this.authService);
        }
        return this.dataProvider;
    }
}
