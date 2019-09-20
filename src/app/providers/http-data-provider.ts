import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { share, shareReplay, tap, map, catchError } from 'rxjs/operators';

import { Language } from '../language-model';
import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { AuthService } from '../auth/auth.service';

import { StatisticsUser } from '../statistics-user.model';
import { StatisticsLanguage } from '../statistics-language.model';
import { TokenEntry, Response } from '../http-response.model';

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
    private allLanguagesObservable: Observable<string[]>;

    private statisticsUsersUrl = 'https://whateveryouwannacallit.tk/stats/users';
    private statisticsLanguagesUrl = 'https://whateveryouwannacallit.tk/stats/languages';
    private entriesUrl = 'https://whateveryouwannacallit.tk/entries';
    private languageIndexerUrl = 'https://whateveryouwannacallit.tk/languages';
    private allLanguagesUrl = 'https://whateveryouwannacallit.tk/alllanguages';

    constructor(private http: HttpClient, private authService: AuthService) {}

    public toWordEntry({userId, id, fromlanguage, tolanguage, word, translations, score, tags}: DbWordEntry): WordEntry {
        // DB allows for multiple null translations and stores them as such
        if (!translations) translations = [];
        return new WordEntry(userId, id, fromlanguage, tolanguage, word, translations, score, tags);
    }

    public retrieveEntries(): Observable<WordEntry[]> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting retrieveEntries() from admin user!');
        // We take advantage of the 'lazy loading' because this way we do not refetch
        // the data on every access.
        if (!this.entriesObservable) {
            this.entriesObservable = this.http.get<Response<DbWordEntry[]>>(this.entriesUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: entries }) => entries.map(this.toWordEntry)),
                shareReplay()
            );
        }
        return this.entriesObservable;
    }

    public retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting retrieveLanguageIndexer() from admin user!');
        // We take advantage of the 'lazy loading' because this way we do not refetch
        // the data on every access.
        if (!this.languageIndexerObservable) {
            this.languageIndexerObservable = this.http.get<Response<Language[]>>(this.languageIndexerUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: languages }) => new LanguageIndexer(languages)),
                shareReplay()
            );
        }
        return this.languageIndexerObservable;
    }

    public retrieveAllLanguages(): Observable<string[]> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting retrieveLanguageIndexer() from admin user!');
        // We take advantage of the 'lazy loading' because this way we do not refetch
        // the data on every access.
        if (!this.allLanguagesObservable) {
            this.allLanguagesObservable = this.http.get<Response<string[]>>(this.allLanguagesUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: languages }) => languages),
                shareReplay()
            );
        }
        return this.allLanguagesObservable;
    }

    private resetEntries() {
        this.entriesObservable = null;
    }

    public addWordEntry({ src, dst }: LanguagePair,
                        word: string,
                        translations: string[],
                        tags: string[]): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting addWordEntry() from admin user!');
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, tags };
        return this.http.post<any>(this.entriesUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
        );
    }

    public updateWordEntry(id: number,
                           { src, dst }: LanguagePair,
                           word: string,
                           translations: string[],
                           score: number,
                           tags: string[]): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting updateWordEntry() from admin user!');
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;
        const url = this.entriesUrl + `/${id}`;
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, score, tags };
        return this.http.put<any>(url, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries())
        );
    }

    public removeWordEntry(id: number): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(), 'Requesting removeWordEntry() from admin user!');
        const url = this.entriesUrl + `/${id}`;
        return this.http.delete<any>(url).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries())
        );
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }


    // For Admin
    public retrieveStatisticsUsers(): Observable<StatisticsUser[]> {
        console.assert(this.authService.currentUserIsAdmin(), 'Requesting retrieveStatisticsUsers() from non-admin user!');
        return this.http.get<Response<StatisticsUser[]>>(this.statisticsUsersUrl).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            map(({ data }) => data),
            shareReplay()
        );
    }

    public retrieveStatisticsLanguages(): Observable<StatisticsLanguage[]> {
        console.assert(this.authService.currentUserIsAdmin(), 'Requesting retrieveStatisticsLanguages() from non-admin user!');
        return this.http.get<Response<StatisticsLanguage[]>>(this.statisticsLanguagesUrl).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            map(({ data }) => data),
            shareReplay()
        );
    }

    public addLanguage(name: string): Observable<void> {
        console.assert(this.authService.currentUserIsAdmin(), 'Requesting retrieveStatisticsLanguages() from non-admin user!');
        const payload = { name };
        return this.http.post<any>(this.statisticsLanguagesUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            shareReplay()
        );
    }
}
