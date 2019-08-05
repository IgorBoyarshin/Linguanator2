import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { Injectable } from '@angular/core';

import { DataProviderFactoryService } from './providers/data-provider-factory.service';
import { LanguagePair } from './language-pair.model';
import { LanguageIndexer } from './language-indexer';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private currentLanguagePair: LanguagePair;

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    languagePairInUse(): Observable<LanguagePair> {
        if (!this.currentLanguagePair) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
                    this.currentLanguagePair = new LanguagePair(
                        languageIndexer.indexOf("German"),
                        languageIndexer.indexOf("English")
                    );
                    subscriber.next(this.currentLanguagePair);
                });
            });
        }
        return of(this.currentLanguagePair);
    }

    flipLanguagePairInUse() {
        if (!this.currentLanguagePair)
            console.error('[SettingsService:flipLanguagePairInUse()]: called without existing currentLanguagePair');
        const {src, dst} = this.currentLanguagePair;
        this.currentLanguagePair = new LanguagePair(dst, src);
    }

    setLanguagePairTo(languagePair: LanguagePair) {
        this.currentLanguagePair = languagePair;
    }
}
