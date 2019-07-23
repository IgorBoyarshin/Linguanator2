import { WordEntry } from './word-entry.model';
import { LanguageIndexer } from './language-indexer';

export interface DataProvider {
    retrieveWords(): WordEntry[];
    retrieveLanguageIndexer(): LanguageIndexer;
}
