import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Dictionary } from './dictionary.model';
import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
import { DataProviderFactoryService } from './providers/data-provider-factory.service';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    private dictionary: Dictionary;
    private dictionaryObservable: Observable<Dictionary>;

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    // Instead of retrieving the whole words base on each call of wordsFor()
    // only to access a specific set of words from there, let us store the
    // dictionary and let the user indicate us when the dictionary is no longer
    // valid and needs to be updated.
    // So the dictionary variable is sort of cached
    resetCache() {
        this.dictionary = null;
    }

    wordsFor({src, dst}: LanguagePair): Observable<WordEntry[]> {
        if (!this.dictionary) {
            if (!this.dictionaryObservable) {
                this.dictionaryObservable = Observable.create(subscriber => {
                    this.dataProviderFactory.dataProviderInUse().retrieveWords().subscribe(words => {
                        this.dictionary = new Dictionary();
                        this.dictionary.add(...words);
                        subscriber.next(this.dictionary);
                    });
                });
            }
            return this.dictionaryObservable.pipe(map(dictionary => dictionary.from(src).to(dst)));
        }
        return of(this.dictionary.from(src).to(dst));
    }

    private randomInt(exclusiveMax) {
        return Math.floor(Math.random() * exclusiveMax);
    }

    private randomOf(arr: any[]): any {
        return arr[this.randomInt(arr.length)];
    }

    randomWordEntryFor(languagePair: LanguagePair): Observable<WordEntry> {
        return Observable.create(subscriber => {
            this.wordsFor(languagePair).subscribe(words => {
                subscriber.next(this.randomOf(words));
            })
        });
    }
}
