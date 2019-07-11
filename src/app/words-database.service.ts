import { Injectable } from '@angular/core';

import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
import { SettingsService } from './settings.service';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    gerToEng: WordEntry[];

    constructor(private settingsService: SettingsService) {
        const eng = this.settingsService.indexOfLanguage("English");
        const ger = this.settingsService.indexOfLanguage("German");
        this.gerToEng = [
            new WordEntry(eng, ger, 'weit',       ['wide', 'far', 'broad'],               2, ['tag1', 'tag2']),
            new WordEntry(eng, ger, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry(eng, ger, 'gehorsam',   ['obedient', 'submissive'],             1, []),
        ];
    }

    // TODO
    wordsForLanguagePair(languagePair: LanguagePair): WordEntry[] {
        // For now return the default
        return this.gerToEng;
    }

    private randomInt(exclusiveMax) {
        return Math.floor(Math.random() * exclusiveMax);
    }

    randomWordEntry(): WordEntry {
        return this.gerToEng[this.randomInt(this.gerToEng.length)];
    }
}
