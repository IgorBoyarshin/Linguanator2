import { Injectable } from '@angular/core';

import { WordEntry } from './word-entry.model';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    gerToEng: WordEntry[];

    constructor() {
        this.gerToEng = [
            new WordEntry('weit',       ['wide', 'far', 'broad'], 2, ['tag1', 'tag2']),
            new WordEntry('aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry('gehorsam',   ['obedient', 'submissive'], 1, []),
        ];
    }

    private randomInt(exclusiveMax) {
      return Math.floor(Math.random() * exclusiveMax);
    }

    randomWordEntry(): WordEntry {
        return this.gerToEng[this.randomInt(this.gerToEng.length)];
    }

    tagForIndex(index: number): string {
        if (index >= this.tags.length) {
            console.error("Index of tag ", index, " is indalid!");
            return "UNKNOWN_TAG";
        }
        return this.tags[index];
    }

    indexOfTag(tag: string): number {
        for (let i = 0; i < this.tags.length; i++) {
            if (this.tags[i] == tag) {
                return i;
            }
        }
        console.error("Tag '", tag, "' doesn't exist!");
        return -1;
    }
}
