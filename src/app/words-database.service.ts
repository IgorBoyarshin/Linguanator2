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
    private tags: string[];

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    // Instead of retrieving the whole words base on each call of wordsFor()
    // only to access a specific set of words from there, let us store the
    // dictionary and let the user indicate us when the dictionary is no longer
    // valid and needs to be updated.
    // So the dictionary variable is sort of cached
    resetCache() {
        this.dictionary = null;
        this.tags = null;
    }

    wordsFor({src, dst}: LanguagePair): Observable<WordEntry[]> {
        return this.retrieve(() => this.dictionary.from(src).to(dst));
    }

    allTags(): Observable<string[]> {
        return this.retrieve(() => this.tags);
    }

    // TODO: make a template instead of _any_
    private retrieve(target: () => any): Observable<any> {
        if (!this.dictionary || !this.tags) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveWords().subscribe(words => {
                    this.dictionary = new Dictionary();
                    this.dictionary.add(...words);
                    this.tags = [...new Set( // To leave unique tags
                        words.flatMap(word => word.tags)
                    )];
                    subscriber.next(target());
                });
            });
        }
        return of(target());
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
