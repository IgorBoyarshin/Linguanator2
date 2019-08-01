import { BehaviorSubject } from 'rxjs';

import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export interface DataProvider {
    retrieveWords():           BehaviorSubject<WordEntry[]>;
    retrieveLanguageIndexer(): BehaviorSubject<LanguageIndexer>;

    addWordEntry(wordEntry: WordEntry);
    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry);
    removeWordEntry(potentialIndex: number, wordEntry: WordEntry);
}
