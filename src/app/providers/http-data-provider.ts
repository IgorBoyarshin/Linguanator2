import { HttpClient } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { share, shareReplay, tap, map, catchError } from 'rxjs/operators';

import { Language } from '../language-model';
import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { AuthService } from '../auth/auth.service';

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
    private entries: WordEntry[];
    private languageIndexer: LanguageIndexer;

    private entriesUrl = 'https://whateveryouwannacallit.tk/entries';
    private languageIndexerUrl = 'https://whateveryouwannacallit.tk/languages';

    constructor(private http: HttpClient, private authService: AuthService) {
        this.authService.logoutNotificator().subscribe(() => {
            this.entries = null;
            this.languageIndexer = null;
        });
    }

    toWordEntry({userId, id, fromlanguage, tolanguage, word, translations, score, tags}: DbWordEntry): WordEntry {
        return new WordEntry(userId, id, fromlanguage, tolanguage, word, translations, score, tags);
    }

    retrieveEntries(): Observable<WordEntry[]> {
        // TODO: Potentially creates multiple Observables, each one sent to query
        // the result and rewrite this.entries upon arrival
        if (!this.entries) {
            return Observable.create(subscriber => {
                console.log('Sending get() from retrieveEntries()');
                this.http.get(this.entriesUrl).subscribe((dbEntries: DbWordEntry[]) => {
                    const entries = dbEntries.map(this.toWordEntry);
                    console.log('Processing result in retrieveEntries()');
                    this.entries = entries;
                    subscriber.next(entries);
                });
            });
        }
        return of(this.entries);
    }

    retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexer) {
            // TODO: need to store the created observable and return it
            // console.log('Pre-tapping get() from retrieveLanguageIndexer()');
            // return this.http.get(this.languageIndexerUrl).pipe(
            //     tap(_ => console.log('Tapping get() from retrieveLanguageIndexer()')),
            //     map((languages: Language[]) => new LanguageIndexer(languages)),
            //     tap(languageIndexer => this.languageIndexer = languageIndexer),
            //     shareReplay()
            // );
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

    private resetEntries() {
        this.entries = null;
    }


    addWordEntry({ src, dst }: LanguagePair,
                 word: string,
                 translations: string[],
                 tags: string[]): Observable<void> {
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

    updateWordEntry(id: number,
                    { src, dst }: LanguagePair,
                    word: string,
                    translations: string[],
                    score: number,
                    tags: string[]): Observable<void> {
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

    removeWordEntry(id: number): Observable<void> {
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
