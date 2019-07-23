import { Injectable } from '@angular/core';

import { DataProvider } from './data-provider';
import { StaticDataProvider } from './static-data-provider';

@Injectable({
    providedIn: 'root'
})
export class DataProviderFactoryService {
    constructor() {}

    private dataProvider: DataProvider;

    dataProviderInUse(): DataProvider {
        if (!this.dataProvider) {
            // DataProvider to be used throughout the application is set here
            this.dataProvider = new StaticDataProvider();
        }
        return this.dataProvider;
    }
}
