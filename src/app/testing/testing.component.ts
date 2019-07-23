import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { DataProviderFactoryService } from '../data-provider-factory.service';

@Component({
    selector: 'app-testing',
    templateUrl: './testing.component.html',
    styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {
    wordEntry: WordEntry;
    languagePair: LanguagePair;

    private languageIndexer: LanguageIndexer;

    constructor(
            dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
    }

    ngOnInit() {
        this.languagePair = this.settingsService.languagePairInUse();
        const randomWord = this.wordsDatabaseService.randomWordEntryFor(this.languagePair);
        if (randomWord) {
            this.wordEntry = randomWord;
        }
    }

    maybeLanguageSrc(): string {
        // XXX: In future must account for both directions
        return this.languagePair ? this.languageIndexer.nameOf(this.languagePair.src) : "";
    }

    submitInput() {

    }
}
