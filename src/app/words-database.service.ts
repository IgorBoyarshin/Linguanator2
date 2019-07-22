import { Injectable } from '@angular/core';

import { Dictionary } from './dictionary.model';
import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
import { LanguageIndexerService } from './language-indexer.service';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    private dictionary: Dictionary = new Dictionary();

    constructor(private languageIndexer: LanguageIndexerService) {
        // Populate with sample data
        const ger = this.languageIndexer.indexOf("German");
        const eng = this.languageIndexer.indexOf("English");
        const gerToEng = [
            new WordEntry(ger, eng, 'weit',       ['wide', 'far', 'broad'],               2, ['tag1', 'tag2']),
            new WordEntry(ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry(ger, eng, 'gehorsam',   ['obedient', 'submissive'],             1, []),
        ];
        this.dictionary
            .from(ger)
            .to(eng)
            .push(...gerToEng);
    }

    wordsFor({src, dst}: LanguagePair): WordEntry[] {
        return this.dictionary.from(src).to(dst);
    }

    private randomInt(exclusiveMax) {
        return Math.floor(Math.random() * exclusiveMax);
    }

    private randomOf(arr: any[]): any {
        return arr[this.randomInt(arr.length)];
    }

    randomWordEntryFor(languagePair: LanguagePair): WordEntry | undefined {
        return this.randomOf(this.wordsFor(languagePair));
    }
}
