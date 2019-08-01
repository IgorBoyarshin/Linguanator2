import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Dictionary } from './dictionary.model';
import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
// import { LanguageIndexer } from './language-indexer';
import { DataProvider } from './providers/data-provider';
import { StaticDataProvider } from './providers/static-data-provider';
import { DataProviderFactoryService } from './providers/data-provider-factory.service';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    private dataProvider: DataProvider;
    private dictionary: Dictionary;

    private dictionarySubject: BehaviorSubject<Dictionary>;

    constructor(dataProviderFactory: DataProviderFactoryService) {
        this.dictionary = new Dictionary();
        this.dictionarySubject = new BehaviorSubject(this.dictionary);

        this.dataProvider = dataProviderFactory.dataProviderInUse();
        this.dataProvider.retrieveWords().subscribe(words => {
            this.dictionary.clear();
            this.dictionary.add(...words)

            this.dictionarySubject.next(this.dictionary);
        });
    }

    wordsFor({src, dst}: LanguagePair): Observable<WordEntry[]> {
        return this.dictionarySubject.pipe(map(dictionary => dictionary.from(src).to(dst)));
    }

    private randomInt(exclusiveMax) {
        return Math.floor(Math.random() * exclusiveMax);
    }

    private randomOf(arr: any[]): any {
        return arr[this.randomInt(arr.length)];
    }

    randomWordEntryFor({src, dst}: LanguagePair): WordEntry | undefined {
        return this.randomOf(this.dictionary.from(src).to(dst));
    }
}
