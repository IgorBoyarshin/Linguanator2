import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexerService } from '../language-indexer.service';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-testing',
    templateUrl: './testing.component.html',
    styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {
    wordEntry: WordEntry;
    languagePair: LanguagePair;

    constructor(
        private wordsDatabaseService: WordsDatabaseService,
        private languageIndexer: LanguageIndexerService,
        private settingsService: SettingsService) {}

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
