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

class DbWordEntryNoId {
    constructor(
        public fromLanguage: number,
        public toLanguage: number,
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

    toDbWordEntryNoId({id, from, to, word, translations, score, tags}: WordEntry): DbWordEntryNoId {
        return new DbWordEntryNoId(from, to, word, translations, score, tags);
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

    private resetWords() {
        this.words = null;
    }

    addWordEntry(wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            console.log('Sending post() from addWordEntry()');
            this.http.post<DbWordEntryNoId>(this.wordsUrl, this.toDbWordEntryNoId(wordEntry)).subscribe(res => {
                console.log('Processing result in addWordEntry(): ', res);
                // this.words.push(wordEntry);
                this.resetWords();
                subscriber.next();
            }, err => console.error(err));
        });
    }

    updateWordEntry(_potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            console.log('Sending update() from updateWordEntry()');
            const { id } = oldEntry; // TODO don't need the whole oldEntry
            const url = this.wordsUrl + `/${id}`;
            this.http.put<DbWordEntryNoId>(url, this.toDbWordEntryNoId(newEntry)).subscribe(res => {
                console.log('Processing result in updateWordEntry(): ', res);
                this.resetWords();
                subscriber.next();
            }, err => console.error(err));
        });
    }

    // Do not need the whole wordEntry now
    removeWordEntry(_potentialIndex: number, wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            console.log('Sending delete() from removeWordEntry()');
            const { id } = wordEntry;
            const url = this.wordsUrl + `/${id}`;
            this.http.delete(url).subscribe(res => {
                console.log('Processing result in removeWordEntry(): ', res);
                this.resetWords();
                subscriber.next();
            }, err => console.error(err));
        });
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }
}
