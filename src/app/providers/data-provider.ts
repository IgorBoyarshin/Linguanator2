import { Observable } from 'rxjs';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { StatisticsUser } from '../statistics-user.model';
import { StatisticsLanguage } from '../statistics-language.model';

export interface DataProvider {
    retrieveEntries():         Observable<WordEntry[]>;
    retrieveLanguageIndexer(): Observable<LanguageIndexer>;

    addWordEntry({ src, dst }: LanguagePair,
                 word: string,
                 translations: string[],
                 tags: string[]): Observable<void>;
    updateWordEntry(id: number,
                    { src, dst }: LanguagePair,
                    word: string,
                    translations: string[],
                    score: number,
                    tags: string[]): Observable<void>;
    removeWordEntry(id: number): Observable<void>;
    retrieveAllLanguages(): Observable<string[]>;

    // For Admin
    retrieveStatisticsUsers(): Observable<StatisticsUser[]>;
    retrieveStatisticsLanguages(): Observable<StatisticsLanguage[]>;
    addLanguage(name: string): Observable<void>;
}
