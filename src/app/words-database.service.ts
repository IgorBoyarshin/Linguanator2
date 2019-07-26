import { Injectable } from '@angular/core';

import { Dictionary } from './dictionary.model';
import { WordEntry } from './word-entry.model';
import { LanguagePair } from './language-pair.model';
// import { LanguageIndexer } from './language-indexer';
import { DataProvider } from './providers/data-provider';
import { StaticDataProvider } from './providers/static-data-provider';
import { DataProviderFactoryService } from './providers/data-provider-factory.service';

@Injectable({
    providedIn: 'root'
})
export class WordsDatabaseService {
    private dataProvider: DataProvider;
    private dictionary: Dictionary = new Dictionary();

    constructor(dataProviderFactory: DataProviderFactoryService) {
        this.dataProvider = dataProviderFactory.dataProviderInUse();
        this.update();
    }

    update() {
        this.dictionary.clear();
        this.dictionary.add(...this.dataProvider.retrieveWords());
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
