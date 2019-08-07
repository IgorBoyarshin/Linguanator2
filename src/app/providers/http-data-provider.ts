import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export class HttpDataProvider implements DataProvider {
    private words: WordEntry[]; // TODO: rename to entries
    private languageIndexer: LanguageIndexer;
    private wordsUrl = 'https://whateveryouwannacallit.tk/words';
    private languageIndexerUrl = 'https://whateveryouwannacallit.tk/languages';

    constructor(private http: HttpClient) {}

    retrieveWords(): Observable<WordEntry[]> {
        // TODO: Potentially creates multiple Observables, each one sent to query
        // the result and rewrite this.words upon arrival
        if (!this.words) {
            return Observable.create(subscriber => {
                this.http.get(this.wordsUrl).subscribe((words: WordEntry[]) => {
                    this.words = words;
                    subscriber.next(words);
                });
            });
        }
        return of(this.words);
    }

    retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexer) {
            return Observable.create(subscriber => {
                this.http.get(this.languageIndexerUrl).subscribe((languages: string[]) => {
                    this.languageIndexer = new LanguageIndexer(languages);
                    subscriber.next(this.languageIndexer);
                });
            });
        }
        return of(this.languageIndexer);
    }

    addWordEntry(wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            this.words.push(wordEntry);
            subscriber.next();
        });
    }

    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            if (!this.indexValidIn(this.words, potentialIndex)) return;
            if (this.words[potentialIndex] === oldEntry) {
                this.words[potentialIndex] = newEntry;
            } else { // deep search
                const index = this.words.indexOf(oldEntry);
                if (index == -1) return; // not found : (
                this.words[index] = newEntry;
            }

            subscriber.next();
        });
    }

    removeWordEntry(potentialIndex: number, wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            if (!this.indexValidIn(this.words, potentialIndex)) return;
            if (this.words[potentialIndex] === wordEntry) {
                this.words.splice(potentialIndex, 1);
            } else { // deep search
                const index = this.words.indexOf(wordEntry);
                if (index == -1) return; // not found : (
                this.words.splice(index, 1);
            }

            subscriber.next();
        });
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }
}
