import { Observable } from 'rxjs';

import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export interface DataProvider {
    retrieveWords():           Observable<WordEntry[]>;
    retrieveLanguageIndexer(): Observable<LanguageIndexer>;

    addWordEntry(wordEntry: WordEntry, onReady: () => void);
    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry, onReady: () => void);
    removeWordEntry(potentialIndex: number, wordEntry: WordEntry, onReady: () => void);
}
