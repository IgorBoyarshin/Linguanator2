import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';

@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
    words: WordEntry[];

    constructor(
        private wordsDatabaseService: WordsDatabaseService,
        private settingsService: SettingsService) {}

    ngOnInit() {
        this.words = this.wordsDatabaseService.wordsForLanguagePair(
            this.settingsService.languagePairInUse()
        );
    }
}
