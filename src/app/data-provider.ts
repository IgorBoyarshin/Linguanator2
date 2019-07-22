import { WordEntry } from './word-entry.model';

export abstract class DataProvider {
    abstract retrieveWords(): WordEntry[];
}
