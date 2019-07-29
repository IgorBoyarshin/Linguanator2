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
            this.addWordEntry(this.dataProviderFactory.dataProviderInUse().retrieveWords(), wordEntry);
            this.wordsDatabaseService.resetCache();
        } else { // Submitting changes to an existing Entry
            this.updateWordEntry(
                this.dataProviderFactory.dataProviderInUse().retrieveWords(),
                this.editedEntryIndex, this.editedEntry, wordEntry);
            this.wordsDatabaseService.resetCache();
            this.editedEntryIndex = undefined;
        }

        this.reloadTable(); // TODO: can avoid reloading the whole table??
    }

    private reloadTable() {
        this.entries = this.wordsDatabaseService.wordsFor(this.languagePair);
    }

    editEntry(entry: WordEntry, index: number) {
        this.editedEntryIndex = index;
        this.editedEntry = entry;
        this.displayEditedEntry.next(entry);
    }

    removeEntry(entry: WordEntry, index: number) {
        this.removeWordEntry(this.dataProviderFactory.dataProviderInUse().retrieveWords(), index, entry);
        this.wordsDatabaseService.resetCache();
        this.reloadTable(); // TODO: can avoid reloading the whole table??
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }

    private addWordEntry(entries: WordEntry[], wordEntry: WordEntry) {
        entries.push(wordEntry);
    }

    private updateWordEntry(entries: WordEntry[], potentialIndex: number,
                            oldEntry: WordEntry, newEntry: WordEntry) {
        if (!this.indexValidIn(entries, potentialIndex)) return;
        if (entries[potentialIndex] === oldEntry) {
            entries[potentialIndex] = newEntry;
        } else { // deep search
            const index = entries.indexOf(oldEntry);
            if (index == -1) return; // not found : (
            entries[index] = newEntry;
        }
    }

    private removeWordEntry(entries: WordEntry[], potentialIndex: number, wordEntry: WordEntry) {
        if (!this.indexValidIn(entries, potentialIndex)) return;
        if (entries[potentialIndex] === wordEntry) {
            entries.splice(potentialIndex, 1);
        } else { // deep search
            const index = entries.indexOf(wordEntry);
            if (index == -1) return; // not found : (
            entries.splice(index, 1);
        }
    }
}
