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
    editedEntry: WordEntry;
    editedEntryIndex: number | undefined;

    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer()
            .subscribe(languageIndexer => {
                this.languageIndexer = languageIndexer
                this.languages = this.languageIndexer.allNames();
            });
        settingsService.languagePairInUse()
            .subscribe(languagePair => {
                this.languagePair = languagePair;
                wordsDatabaseService.wordsFor(this.languagePair) // TODO unsubscribe??
                    .subscribe(words => this.entries = words);

                this.primaryLanguage = this.languageIndexer.nameOf(this.languagePair.src);
                this.secondaryLanguage = this.languageIndexer.nameOf(this.languagePair.dst);
            });
    }

    ngOnInit() {}

    submitEntry(wordEntry: WordEntry) {
        const words = this.dataProviderFactory.dataProviderInUse().retrieveWords();
        if (this.editedEntryIndex === undefined) { // Adding a new Entry
            this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry);
        } else { // Submitting changes to an existing Entry
            this.dataProviderFactory.dataProviderInUse().updateWordEntry(
                this.editedEntryIndex, this.editedEntry, wordEntry);
            this.editedEntryIndex = undefined;
        }
    }

    editEntry(entry: WordEntry, index: number) {
        this.editedEntryIndex = index;
        this.editedEntry = entry;
        this.displayEditedEntry.next(entry);
    }

    removeEntry(entry: WordEntry, index: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(index, entry);
    }

    changeSrcLanguageTo(language: string) {
        const newSrc = this.languageIndexer.indexOf(language);
        if (newSrc == this.languagePair.dst) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const dst = this.languagePair.dst;
            this.settingsService.setLanguagePairTo(new LanguagePair(newSrc, dst));
        }
    }

    changeDstLanguageTo(language: string) {
        const newDst = this.languageIndexer.indexOf(language);
        if (newDst == this.languagePair.src) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const src = this.languagePair.src;
            this.settingsService.setLanguagePairTo(new LanguagePair(src, newDst));
        }
    }
}
