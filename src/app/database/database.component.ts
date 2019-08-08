import { Subject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';

import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService, StatefulTag } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';


@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent {
    entries: WordEntry[];
    languages: string[];
    languagePair: LanguagePair; // @Input into sub-component
    primaryLanguage: string;
    secondaryLanguage: string;
    allStatefulTagsObservable: Observable<StatefulTag[]>;

    private displayEditedEntry: Subject<WordEntry> = new Subject<WordEntry>(); // to child component
    editedEntry: WordEntry;
    editedEntryIndex?: number;


    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.reloadLanguageIndexerAndLanguages();
        this.reloadLanguagePairAndWords();
        this.reloadPrimaryAndSecondaryLanguages();
        this.allStatefulTagsObservable = settingsService.allStatefulTags();
    }

    private reloadLanguageIndexerAndLanguages() {
        this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
            this.languageIndexer = languageIndexer;
            this.languages = this.languageIndexer.allNames();
        });
    }

    private reloadLanguagePairAndWords() {
        this.settingsService.languagePairInUse().subscribe(languagePair => {
            this.languagePair = languagePair;
            this.reloadWords(languagePair);
        });
    }

    private reloadPrimaryAndSecondaryLanguages() {
        combineLatest(this.settingsService.languagePairInUse(),
                      this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer())
            .subscribe(([languagePair, languageIndexer]) => {
                this.primaryLanguage = this.languageIndexer.nameOf(this.languagePair.src);
                this.secondaryLanguage = this.languageIndexer.nameOf(this.languagePair.dst);
            });
    }

    private reloadWords(languagePair: LanguagePair) {
        this.wordsDatabaseService.wordsFor(languagePair)
            .subscribe(words => this.entries = words);
    }

    private resetCacheAndReloadWords(languagePair: LanguagePair) {
        this.wordsDatabaseService.resetCache();
        this.reloadWords(languagePair);
    }

    submitEntry(wordEntry: WordEntry) {
        if (this.editedEntryIndex === undefined) { // adding a new Entry
            this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry)
                .subscribe(() => this.resetCacheAndReloadWords(this.languagePair));
        } else { // submitting changes to an existing Entry
            this.dataProviderFactory.dataProviderInUse().updateWordEntry(
                this.editedEntryIndex, this.editedEntry, wordEntry)
                .subscribe(() => this.resetCacheAndReloadWords(this.languagePair));
            this.editedEntryIndex = undefined;
        }
    }

    removeEntry(entry: WordEntry, index: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(index, entry)
            .subscribe(() => this.resetCacheAndReloadWords(this.languagePair));
    }

    editEntry(entry: WordEntry, index: number) {
        this.editedEntryIndex = index;
        this.editedEntry = entry;
        this.displayEditedEntry.next(entry);
    }

    changeSrcLanguageTo(language: string) {
        const newSrc = this.languageIndexer.indexOf(language);
        if (newSrc == this.languagePair.dst) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const dst = this.languagePair.dst;
            this.settingsService.setLanguagePairTo(new LanguagePair(newSrc, dst));
        }

        this.reloadLanguagePairAndWords();
        this.reloadPrimaryAndSecondaryLanguages();
    }

    changeDstLanguageTo(language: string) {
        const newDst = this.languageIndexer.indexOf(language);
        if (newDst == this.languagePair.src) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const src = this.languagePair.src;
            this.settingsService.setLanguagePairTo(new LanguagePair(src, newDst));
        }

        this.reloadLanguagePairAndWords();
        this.reloadPrimaryAndSecondaryLanguages();
    }
}
