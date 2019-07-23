import { Injectable } from '@angular/core';

import { DataProvider } from './data-provider';
import { StaticDataProvider } from './static-data-provider';

@Injectable({
    providedIn: 'root'
})
export class DataProviderFactoryService {
    constructor() {}

    dataProviderInUse(): DataProvider {
        // DataProvider to be used throughout the application is set here
        return new StaticDataProvider();
    }
}
