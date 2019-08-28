import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';

import { Injectable } from '@angular/core';

import { Dictionary } from './dictionary.model';
import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
import { DataProviderFactoryService } from './providers/data-provider-factory.service';
import { StatefulTag } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class EntriesDatabaseService {
    private dictionary: Dictionary;

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    // Instead of retrieving the whole entries base on each call of entriesFor()
    // only to access a specific set of entries from there, let us store the
    // dictionary and let the user indicate us when the dictionary is no longer
    // valid and needs to be updated.
    // So the dictionary variable is sort of cached
    resetCache() {
        this.dictionary = null;
    }

    entriesFor({src, dst}: LanguagePair): Observable<WordEntry[]> {
        if (!this.dictionary) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveEntries().subscribe(entries => {
                    this.dictionary = new Dictionary();
                    this.dictionary.add(...entries);
                    subscriber.next(this.dictionary.from(src).to(dst));
                });
            });
        }
        return of(this.dictionary.from(src).to(dst));
    }

    entriesForWithStatefulTags(languagePair: LanguagePair, statefulTags: StatefulTag[]): Observable<WordEntry[]> {
        const includedTags = statefulTags.filter(({tag, checked}) => checked).map(({tag}) => tag);
        return this.entriesFor(languagePair).pipe(
            map(entries => entries.filter(entry =>
                entry.tags.some(
                    tag => includedTags.includes(tag)
                )
            ))
        );
    }

    private randomInt(exclusiveMax) {
        return Math.floor(Math.random() * exclusiveMax);
    }

    private randomOf(arr: any[]): any {
        return arr[this.randomInt(arr.length)];
    }

    randomWordEntryFor(languagePair: LanguagePair): Observable<WordEntry> {
        return Observable.create(subscriber => {
            this.entriesFor(languagePair).subscribe(entries => {
                subscriber.next(this.randomOf(entries));
            })
        });
    }

    randomWordEntryForWithStatefulTags(languagePair: LanguagePair, statefulTags: StatefulTag[]): Observable<WordEntry> {
        return Observable.create(subscriber => {
            this.entriesForWithStatefulTags(languagePair, statefulTags).subscribe(entries => {
                subscriber.next(this.randomOf(entries));
            })
        });
    }
}
