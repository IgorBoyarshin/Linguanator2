import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { LanguageIndexerService } from '../language-indexer.service';

@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
    words: WordEntry[];
    languages: string[];
    primaryLanguage: string;
    secondaryLanguage: string;

    constructor(
            private wordsDatabaseService: WordsDatabaseService,
            private languageIndexer: LanguageIndexerService,
            private settingsService: SettingsService) {
        this.languages = languageIndexer.allNames();
        this.primaryLanguage = this.languages[1];
        this.secondaryLanguage = this.languages[0];
    }

    ngOnInit() {
        this.words = this.wordsDatabaseService.wordsForLanguagePair(
            this.settingsService.languagePairInUse()
        );
    }
}
