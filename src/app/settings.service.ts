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
    private currentLanguagePairObservable: Observable<LanguagePair>;

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    languagePairInUse(): Observable<LanguagePair> {
        if (!this.currentLanguagePair) {
            if (!this.currentLanguagePairObservable) {
                this.currentLanguagePairObservable = Observable.create(subscriber => {
                    this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
                        this.currentLanguagePair = new LanguagePair(
                            languageIndexer.indexOf("German"),
                            languageIndexer.indexOf("English")
                        );
                        subscriber.next(this.currentLanguagePair);
                    });
                })
            }
            return this.currentLanguagePairObservable;
        }
        return of(this.currentLanguagePair);
    }

    flipLanguagePairInUse() {
        // TODO: also ubsubscribe from potential ongoing Observable request??
        if (!this.currentLanguagePair) return;
        const {src, dst} = this.currentLanguagePair;
        this.currentLanguagePair = new LanguagePair(dst, src);
    }

    setLanguagePairTo(languagePair: LanguagePair) {
        // TODO: also ubsubscribe from potential ongoing Observable request??
        this.currentLanguagePair = languagePair;
    }
}
