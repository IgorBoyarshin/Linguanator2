import { Injectable } from '@angular/core';

import { DataProviderFactoryService } from './data-provider-factory.service';
import { LanguagePair } from './language-pair.model';
import { LanguageIndexer } from './language-indexer';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private currentLanguagePair: LanguagePair;

    constructor(dataProviderFactory: DataProviderFactoryService) {
        const languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
        this.currentLanguagePair = new LanguagePair(
            languageIndexer.indexOf("German"),
            languageIndexer.indexOf("English")
        );
    }

    languagePairInUse(): LanguagePair {
        return this.currentLanguagePair;
    }
}
