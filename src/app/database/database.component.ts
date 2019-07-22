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
        private settingsService: SettingsService) {}

    ngOnInit() {
        const languagePair = this.settingsService.languagePairInUse();
        this.words = this.wordsDatabaseService.wordsFor(languagePair);
        this.primaryLanguage = this.languageIndexer.nameOf(languagePair.src);
        this.secondaryLanguage = this.languageIndexer.nameOf(languagePair.dst);
        this.languages = this.languageIndexer.allNames();
    }
}
