import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export interface DataProvider {
    retrieveWords(): WordEntry[];
    retrieveLanguageIndexer(): LanguageIndexer;
    addWordEntry(wordEntry: WordEntry);
    updateWordEntry(index: number, updatedWordEntry: WordEntry);
    removeWordEntry(index: number);
}
