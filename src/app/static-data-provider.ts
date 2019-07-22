import { DataProvider } from './data-provider';
import { WordEntry } from './word-entry.model';

export class StaticDataProvider extends DataProvider {
    words: WordEntry[];
    // languages: string[];

    constructor() {
        super();
    }

    retrieveWords(): WordEntry[] {
        if (!this.words) {
            // const ger = this.languageIndexer.indexOf("German");
            // const eng = this.languageIndexer.indexOf("English");
            const ger = 1; // TODO
            const eng = 0; // TODO
            this.words = [
                new WordEntry(ger, eng, 'weit',       ['wide', 'far', 'broad'],               2, ['tag1', 'tag2']),
                new WordEntry(ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
                new WordEntry(ger, eng, 'gehorsam',   ['obedient', 'submissive'],             1, []),
            ];
        }
        return this.words;
    }

    // retrieveLanguages(): string[] {
    //     if (!this.languages) {
    //         this.languages = [
    //             "English",
    //             "German"
    //         ];
    //     }
    //     return this.languages;
    // }
}
