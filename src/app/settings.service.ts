import { Injectable } from '@angular/core';

import { ReplaySubject } from 'rxjs';

import { DataProviderFactoryService } from './providers/data-provider-factory.service';
import { LanguagePair } from './language-pair.model';
import { LanguageIndexer } from './language-indexer';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private currentLanguagePair: LanguagePair | undefined = undefined;

    private languagePairSubject: ReplaySubject<LanguagePair> = new ReplaySubject<LanguagePair>();

    constructor(dataProviderFactory: DataProviderFactoryService) {
        dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer()
            .subscribe(languageIndexer => {
                this.currentLanguagePair = new LanguagePair(
                    languageIndexer.indexOf("German"),
                    languageIndexer.indexOf("English")
                );
                this.languagePairSubject.next(this.currentLanguagePair)
            });
    }

    languagePairInUse(): ReplaySubject<LanguagePair> {
        return this.languagePairSubject;
    }

    flipLanguagePairInUse() {
        if (!this.currentLanguagePair) return;
        const {src, dst} = this.currentLanguagePair;
        this.currentLanguagePair = new LanguagePair(dst, src);
        this.languagePairSubject.next(this.currentLanguagePair)
    }

    setLanguagePairTo(languagePair: LanguagePair) {
        this.currentLanguagePair = languagePair;
        this.languagePairSubject.next(this.currentLanguagePair)
    }
}
