import { Injectable } from '@angular/core';

import { LanguagePair } from './language-pair.model';
import { LanguageIndexerService } from './language-indexer.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private currentLanguagePair: LanguagePair;

    constructor(private languageIndexer: LanguageIndexerService) {
        this.currentLanguagePair = new LanguagePair(
            this.languageIndexer.indexOf("German"),
            this.languageIndexer.indexOf("English")
        );
    }

    languagePairInUse(): LanguagePair {
        return this.currentLanguagePair;
    }
}
