import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';

import { Subject } from 'rxjs';

@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
    entries: WordEntry[];
    languages: string[];
    languagePair: LanguagePair; // @Input into sub-component
    primaryLanguage: string;
    secondaryLanguage: string;

    private displayEditedEntry: Subject<WordEntry> = new Subject<WordEntry>();
    editedEntryIndex: number | undefined;

    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
    }

    ngOnInit() {
        this.languagePair = this.settingsService.languagePairInUse();
        this.entries = this.wordsDatabaseService.wordsFor(this.languagePair);
        this.primaryLanguage = this.languageIndexer.nameOf(this.languagePair.src);
        this.secondaryLanguage = this.languageIndexer.nameOf(this.languagePair.dst);
        this.languages = this.languageIndexer.allNames();
    }

    submitEntry(wordEntry: WordEntry) {
        if (this.editedEntryIndex === undefined) { // Adding a new Entry
            // TODO: probably need to do this in one place instead of two:
            this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry); // TODO
            this.wordsDatabaseService.wordsFor(this.languagePair).push(wordEntry); // TODO
            this.reloadTable(); // TODO: can avoid reloading the whole table??
        } else { // Submitting changes to an existing Entry
            // TODO: probably need to do this in one place instead of two:
            this.dataProviderFactory.dataProviderInUse()
                .updateWordEntry(this.editedEntryIndex, wordEntry); // TODO
            this.wordsDatabaseService.wordsFor(this.languagePair)[this.editedEntryIndex] = wordEntry; // TODO
            this.reloadTable(); // TODO: can avoid reloading the whole table??
            this.editedEntryIndex = undefined;
        }
    }

    private reloadTable() {
        this.entries = this.wordsDatabaseService.wordsFor(this.languagePair);
    }

    editEntry(index: number) {
        const entry = this.entries[index];
        const word = entry.word;
        const translations = entry.translations.join(";");
        const tags = entry.tags.join(";");
        this.editedEntryIndex = index;
        this.displayEditedEntry.next(entry);
    }

    // TODO: improve. Unsafe now
    removeEntry(index: number) {
        // TODO: probably need to do this in one place instead of two:
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(index); // TODO
        this.wordsDatabaseService.wordsFor(this.languagePair).splice(index, 1); // TODO
        this.reloadTable(); // TODO: can avoid reloading the whole table??
    }
}
