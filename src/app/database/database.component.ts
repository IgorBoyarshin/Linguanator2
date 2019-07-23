import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';

@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
    words: WordEntry[];
    languages: string[];
    languagePair: LanguagePair;
    primaryLanguage: string;
    secondaryLanguage: string;

    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
    }

    ngOnInit() {
        this.languagePair = this.settingsService.languagePairInUse();
        this.words = this.wordsDatabaseService.wordsFor(this.languagePair);
        this.primaryLanguage = this.languageIndexer.nameOf(this.languagePair.src);
        this.secondaryLanguage = this.languageIndexer.nameOf(this.languagePair.dst);
        this.languages = this.languageIndexer.allNames();
    }

    addWordEntry(wordEntry: WordEntry) {
        // TODO: probably need to do add the word in one place instead of two:
        this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry); // TODO
        this.wordsDatabaseService.wordsFor(this.languagePair).push(wordEntry); // TODO
        this.reloadTable();
    }

    private reloadTable() {
        this.words = this.wordsDatabaseService.wordsFor(this.languagePair);
    }
}
