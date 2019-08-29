import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { share, shareReplay, tap, map, catchError } from 'rxjs/operators';

import { Language } from '../language-model';
import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';

class DbWordEntry {
    constructor(
        public userId: number,
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
    private entriesObservable: Observable<WordEntry[]>;
    private languageIndexerObservable: Observable<LanguageIndexer>;

    private entriesUrl = 'https://whateveryouwannacallit.tk/entries';
    private languageIndexerUrl = 'https://whateveryouwannacallit.tk/languages';

    constructor(private http: HttpClient) {}

    public toWordEntry({userId, id, fromlanguage, tolanguage, word, translations, score, tags}: DbWordEntry): WordEntry {
        // DB allows for multiple null translations and stores them as such
        if (!translations) translations = [];
        return new WordEntry(userId, id, fromlanguage, tolanguage, word, translations, score, tags);
    }

    public retrieveEntries(): Observable<WordEntry[]> {
        if (!this.entriesObservable) {
            this.entriesObservable = this.http.get<DbWordEntry[]>(this.entriesUrl).pipe(
                tap(_ => console.log('Tapping get() from retrieveEntries()')),
                map(entries => entries.map(this.toWordEntry)),
                shareReplay()
            );
        }
        return this.entriesObservable;
    }

    public retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexerObservable) {
            this.languageIndexerObservable = this.http.get<Language[]>(this.languageIndexerUrl).pipe(
                tap(_ => console.log('Tapping get() from retrieveLanguageIndexer()')),
                map(languages => new LanguageIndexer(languages)),
                shareReplay()
            );
        }
        return this.languageIndexerObservable;
    }

    private resetEntries() {
        this.entriesObservable = null;
    }


    public addWordEntry({ src, dst }: LanguagePair,
                        word: string,
                        translations: string[],
                        tags: string[]): Observable<void> {
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;

        return Observable.create(subscriber => {
            console.log('Sending post() from addWordEntry()');
            this.http.post<any>(this.entriesUrl,
                    { fromLanguage: src, toLanguage: dst, word, translations, tags })
                .pipe(catchError((err) => {console.error('HERE', err); return of();}))
                .subscribe(res => {
                    console.log('Processing result in addWordEntry(): ', res);
                    this.resetEntries();
                    subscriber.next();
                }, err => console.error('HERE2', err));
        }).pipe(catchError((err) => {console.error('HERE3', err); return of();}));
    }

    public updateWordEntry(id: number,
                           { src, dst }: LanguagePair,
                           word: string,
                           translations: string[],
                           score: number,
                           tags: string[]): Observable<void> {
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;

        return Observable.create(subscriber => {
            console.log('Sending update() from updateWordEntry()');
            const url = this.entriesUrl + `/${id}`;
            this.http.put<any>(url,
                    { fromLanguage: src, toLanguage: dst, word, translations, score, tags })
                .subscribe(res => {
                    console.log('Processing result in updateWordEntry(): ', res);
                    this.resetEntries();
                    subscriber.next();
                }, err => console.error(err));
        });
    }

    public removeWordEntry(id: number): Observable<void> {
        return Observable.create(subscriber => {
            console.log('Sending delete() from removeWordEntry()');
            const url = this.entriesUrl + `/${id}`;
            this.http.delete(url).subscribe(res => {
                console.log('Processing result in removeWordEntry(): ', res);
                this.resetEntries();
                subscriber.next();
            }, err => console.error(err));
        });
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }
}
