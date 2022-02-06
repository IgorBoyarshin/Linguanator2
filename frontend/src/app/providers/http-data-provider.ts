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
    // We take advantage of the 'lazy loading' because this way we do not refetch
    // the data on every access.
    private entriesObservable: Observable<WordEntry[]>;
    private selfLanguagesIndexerObservable: Observable<LanguageIndexer>;
    private allLanguagesIndexerObservable: Observable<LanguageIndexer>;

    // TODO: exclude domain name into a separate variable
    private tagsRenameUrl = 'http://localhost:1234/tags/rename';
    private tagsRemoveUrl = 'http://localhost:1234/tags';
    private statisticsUsersUrl = 'http://localhost:1234/stats/users';
    private statisticsAllLanguagesUrl = 'http://localhost:1234/stats/alllanguages';
    private entriesUrl = 'http://localhost:1234/entries';
    private selfLanguagesUrl = 'http://localhost:1234/selflanguages';
    private allLanguagesUrl = 'http://localhost:1234/alllanguages';


    constructor(private http: HttpClient, private authService: AuthService) {}


    // ------------------------------- Entries --------------------------------

    public retrieveEntries(): Observable<WordEntry[]> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting retrieveEntries() from admin user!');

        if (!this.entriesObservable) {
            this.entriesObservable = this.http.get<Response<DbWordEntry[]>>(this.entriesUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: entries }) => entries.map(this.toWordEntry)),
                shareReplay()
            );
        }
        return this.entriesObservable;
    }

    public addWordEntry({ src, dst }: LanguagePair,
                        word: string,
                        translations: string[],
                        tags: string[]): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting addWordEntry() from admin user!');
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, tags };
        return this.http.post<Response<any>>(this.entriesUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
            map(_ => void(0))
        );
    }

    public updateWordEntry(id: number,
                           { src, dst }: LanguagePair,
                           word: string,
                           translations: string[],
                           score: number,
                           tags: string[]): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting updateWordEntry() from admin user!');
        // DB allows for multiple null translations and stores them as such
        if (translations.length == 0) translations = null;
        const url = this.entriesUrl + `/${id}`;
        const payload = { fromLanguage: src, toLanguage: dst, word, translations, score, tags };
        return this.http.put<Response<any>>(url, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
            map(_ => void(0))
        );
    }

    public removeWordEntry(id: number): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting removeWordEntry() from admin user!');
        const url = this.entriesUrl + `/${id}`;
        return this.http.delete<Response<any>>(url).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
            map(_ => void(0))
        );
    }

    private resetEntries() {
        this.entriesObservable = null;
    }

    // ------------------------------- Tags --------------------------------

    public renameTag(oldName: string, newName: string): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting renameTag() from admin user!');
        const payload = { oldName, newName };
        return this.http.put<Response<any>>(this.tagsRenameUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
            map(_ => void(0))
        );
    }

    public removeTag(name: string): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting removeTag() from admin user!');
        const url = this.tagsRemoveUrl + `/${name}`;
        return this.http.delete<Response<any>>(url).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetEntries()),
            map(_ => void(0))
        );
    }

    // ------------------------------ Self Languages --------------------------

    public retrieveSelfLanguagesIndexer(): Observable<LanguageIndexer> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting retrieveSelfLanguagesIndexer() from admin user!');

        if (!this.selfLanguagesIndexerObservable) {
            this.selfLanguagesIndexerObservable = this.http.get<Response<Language[]>>(this.selfLanguagesUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: languages }) => new LanguageIndexer(languages)),
                shareReplay()
            );
        }
        return this.selfLanguagesIndexerObservable;
    }

    public addSelfLanguage(name: string): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting addSelfLanguage() from admin user!');

        const payload = { name };
        return this.http.post<Response<any>>(this.selfLanguagesUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetSelfLanguagesIndexer()),
            map(_ => void(0)),
            shareReplay()
        );
    }

    public removeSelfLanguage(id: number): Observable<void> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting removeSelfLanguage() from admin user!');

        const url = this.selfLanguagesUrl + `/${id}`;
        return this.http.delete<Response<any>>(url).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetSelfLanguagesIndexer()),
            map(_ => void(0)),
            shareReplay()
        );
    }

    private resetSelfLanguagesIndexer() {
        this.selfLanguagesIndexerObservable = null;
    }

    // ------------------------------- All Languages --------------------------

    public retrieveAllLanguagesIndexer(): Observable<LanguageIndexer> {
        console.assert(!this.authService.currentUserIsAdmin(),
            'Requesting retrieveAllLanguagesIndexer() from admin user!');

        if (!this.allLanguagesIndexerObservable) {
            this.allLanguagesIndexerObservable = this.http.get<Response<Language[]>>(this.allLanguagesUrl).pipe(
                tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
                map(({ data: languages }) => new LanguageIndexer(languages)),
                shareReplay()
            );
        }
        return this.allLanguagesIndexerObservable;
    }

    private resetAllLanguagesIndexer() {
        this.allLanguagesIndexerObservable = null;
    }

    // ------------------------------ For Admin -------------------------------

    public retrieveStatisticsUsers(): Observable<StatisticsUser[]> {
        console.assert(this.authService.currentUserIsAdmin(),
            'Requesting retrieveStatisticsUsers() from non-admin user!');
        return this.http.get<Response<StatisticsUser[]>>(this.statisticsUsersUrl).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            map(({ data }) => data),
            shareReplay()
        );
    }

    public retrieveStatisticsLanguages(): Observable<StatisticsLanguage[]> {
        console.assert(this.authService.currentUserIsAdmin(),
            'Requesting retrieveStatisticsLanguages() from non-admin user!');
        return this.http.get<Response<StatisticsLanguage[]>>(this.statisticsAllLanguagesUrl).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            map(({ data }) => data),
            shareReplay()
        );
    }

    public addAllLanguage(name: string): Observable<void> {
        console.assert(this.authService.currentUserIsAdmin(),
            'Requesting addAllLanguage() from non-admin user!');
        const payload = { name };
        return this.http.post<Response<any>>(this.statisticsAllLanguagesUrl, payload).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetAllLanguagesIndexer()),
            map(_ => void(0)),
            shareReplay()
        );
    }

    public removeAllLanguage(id: number): Observable<void> {
        console.assert(this.authService.currentUserIsAdmin(),
            'Requesting removeAllLanguage() from non-admin user!');
        const url = this.allLanguagesUrl + `/${id}`;
        return this.http.delete<Response<any>>(url).pipe(
            tap(({ tokenEntry, isAdmin }) => this.authService.updateSession(tokenEntry, isAdmin)),
            tap(_ => this.resetAllLanguagesIndexer()),
            map(_ => void(0)),
            shareReplay()
        );
    }

    // ------------------------------- Util -----------------------------------

    public toWordEntry({ userId, id, fromlanguage, tolanguage, word, translations, score, tags }: DbWordEntry): WordEntry {
        // DB allows for multiple null translations and stores them as such
        if (!translations) translations = [];
        return new WordEntry(userId, id, fromlanguage, tolanguage, word, translations, score, tags);
    }
}
