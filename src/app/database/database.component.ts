import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../data-provider-factory.service';

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

    private languageIndexer: LanguageIndexer;

    constructor(
            dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
    }

    ngOnInit() {
        const languagePair = this.settingsService.languagePairInUse();
        this.words = this.wordsDatabaseService.wordsFor(languagePair);
        this.primaryLanguage = this.languageIndexer.nameOf(languagePair.src);
        this.secondaryLanguage = this.languageIndexer.nameOf(languagePair.dst);
        this.languages = this.languageIndexer.allNames();
    }
}
