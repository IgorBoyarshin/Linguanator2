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
            this.addWordEntry(this.dataProviderFactory.dataProviderInUse().retrieveWords(), wordEntry);
            this.addWordEntry(this.wordsDatabaseService.wordsFor(this.languagePair), wordEntry);
            // this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry); // TODO
            // this.wordsDatabaseService.wordsFor(this.languagePair).push(wordEntry); // TODO
        } else { // Submitting changes to an existing Entry
            // TODO: probably need to do this in one place instead of two:
            this.updateWordEntry(
                this.dataProviderFactory.dataProviderInUse().retrieveWords(),
                this.editedEntryIndex, null, wordEntry);
            this.updateWordEntry(
                this.wordsDatabaseService.wordsFor(this.languagePair),
                this.editedEntryIndex, null, wordEntry);

            // this.dataProviderFactory.dataProviderInUse()
            //     .updateWordEntry(this.editedEntryIndex, wordEntry); // TODO
            // this.wordsDatabaseService.wordsFor(this.languagePair)[this.editedEntryIndex] = wordEntry; // TODO
            this.editedEntryIndex = undefined;
        }

        this.reloadTable(); // TODO: can avoid reloading the whole table??
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

    removeEntry(index: number) {
        // TODO: probably need to do this in one place instead of two:
        this.removeWordEntry(
            this.dataProviderFactory.dataProviderInUse().retrieveWords(),
            this.editedEntryIndex, null);
        this.removeWordEntry(
            this.wordsDatabaseService.wordsFor(this.languagePair),
            this.editedEntryIndex, null);
        // this.dataProviderFactory.dataProviderInUse().removeWordEntry(index); // TODO
        // this.wordsDatabaseService.wordsFor(this.languagePair).splice(index, 1); // TODO
        this.reloadTable(); // TODO: can avoid reloading the whole table??
    }

    private indexValidIn(array: any[], index: number) {
        return (0 <= index) && (index < array.length);
    }

    private addWordEntry(entries: WordEntry[], wordEntry: WordEntry) {
        entries.push(wordEntry);
    }

    private updateWordEntry(entries: WordEntry[], potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry) {
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
