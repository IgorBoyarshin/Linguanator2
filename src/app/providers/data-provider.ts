import { Observable } from 'rxjs';

import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export interface DataProvider {
    retrieveWords():           Observable<WordEntry[]>;
    retrieveLanguageIndexer(): Observable<LanguageIndexer>;

    addWordEntry(wordEntry: WordEntry): Observable<void>;
    updateWordEntry(id: number, newEntry: WordEntry): Observable<void>;
    removeWordEntry(id: number): Observable<void>;
}
