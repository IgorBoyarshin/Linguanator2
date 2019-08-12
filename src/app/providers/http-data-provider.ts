import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { Language } from '../language-model';
import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

class DbWordEntry {
    constructor(
        public id: number,
        public fromlanguage: number,
        public tolanguage: number,
        public word: string,
        public translations: string[],
        public score: number,
        public tags: string[]
    ) {}

}

export class HttpDataProvider implements DataProvider {
    private words: WordEntry[]; // TODO: rename to entries
    private languageIndexer: LanguageIndexer;
    private wordsUrl = 'https://whateveryouwannacallit.tk/words';
    private languageIndexerUrl = 'https://whateveryouwannacallit.tk/languages';

    constructor(private http: HttpClient) {}

    toWordEntry({id, fromlanguage, tolanguage, word, translations, score, tags}: DbWordEntry): WordEntry {
        return new WordEntry(id, fromlanguage, tolanguage, word, translations, score, tags);
    }

    retrieveWords(): Observable<WordEntry[]> {
        // TODO: Potentially creates multiple Observables, each one sent to query
        // the result and rewrite this.words upon arrival
        if (!this.words) {
            return Observable.create(subscriber => {
                console.log('Sending get() from retrieveWords()');
                this.http.get(this.wordsUrl).subscribe((dbWords: DbWordEntry[]) => {
                    const words = dbWords.map(this.toWordEntry);
                    console.log('Processing result in retrieveWords()');
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
                console.log('Sending get() from retrieveLanguageIndexer()');
                this.http.get(this.languageIndexerUrl).subscribe((languages: Language[]) => {
                    console.log('Processing result in retrieveLanguageIndexer()');
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
