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
        // We take advantage of the 'lazy loading' because this way we do not refetch
        // the data on every access.
        if (!this.entriesObservable) {
            this.entriesObservable = this.http.get<DbWordEntry[]>(this.entriesUrl).pipe(
                map(entries => entries.map(this.toWordEntry)),
                shareReplay()
            );
        }
        return this.entriesObservable;
    }

    public retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        // We take advantage of the 'lazy loading' because this way we do not refetch
        // the data on every access.
        if (!this.languageIndexerObservable) {
            this.languageIndexerObservable = this.http.get<Language[]>(this.languageIndexerUrl).pipe(
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
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, tags };
        return this.http.post<any>(this.entriesUrl, payload).pipe(
            tap(_ => this.resetEntries()),
        );
    }

    public updateWordEntry(id: number,
                           { src, dst }: LanguagePair,
                           word: string,
                           translations: string[],
                           score: number,
                           tags: string[]): Observable<void> {
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;
        const url = this.entriesUrl + `/${id}`;
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, score, tags };
        return this.http.put<any>(url, payload).pipe(
            tap(_ => this.resetEntries())
        );
    }

    public removeWordEntry(id: number): Observable<void> {
        const url = this.entriesUrl + `/${id}`;
        return this.http.delete<any>(url).pipe(
            tap(_ => this.resetEntries())
        );
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }
}
