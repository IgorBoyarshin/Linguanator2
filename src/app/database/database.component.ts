import { Subject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';

import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { EntriesDatabaseService } from '../entries-database.service';
import { SettingsService, StatefulTag } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';


@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent {
    entries: Observable<WordEntry[]>;
    languages: string[];
    languagePair: LanguagePair; // @Input into sub-component
    primaryLanguage: string;
    secondaryLanguage: string;
    allStatefulTagsObservable: Observable<StatefulTag[]>;

    private displayEditedEntry: Subject<WordEntry> = new Subject<WordEntry>(); // to child component
    editedEntryId?: number;

    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private entriesDatabaseService: EntriesDatabaseService,
            private settingsService: SettingsService) {
        this.reloadLanguageIndexerAndLanguages();
        this.reloadLanguagePairAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
        this.allStatefulTagsObservable = settingsService.allStatefulTags();
    }

    private reloadLanguageIndexerAndLanguages() {
        this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
            this.languageIndexer = languageIndexer;
            this.languages = this.languageIndexer.allNames();
        });
    }

    private reloadLanguagePairAndEntries() {
        this.settingsService.languagePairInUse().subscribe(languagePair => {
            this.languagePair = languagePair;
            this.reloadEntries(languagePair);
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

    private reloadEntries(languagePair: LanguagePair) {
        this.allStatefulTagsObservable = this.settingsService.allStatefulTags();
        this.settingsService.allStatefulTags().subscribe(statefulTags => {
            this.entries = this.entriesDatabaseService.entriesForWithStatefulTags(languagePair, statefulTags);
        });
    }

    private resetCacheAndReloadEntries(languagePair: LanguagePair) {
        this.entriesDatabaseService.resetCache();
        this.settingsService.resetCache();
        this.reloadEntries(languagePair);
    }

    toggleTag({tag, checked}: StatefulTag) {
        this.settingsService.setTagState(tag, !checked).subscribe(() => {
            this.allStatefulTagsObservable = this.settingsService.allStatefulTags(); // TODO
            this.reloadEntries(this.languagePair);
        });
    }

    toggleAllTags() {
        // TODO: account for language observable also, just as in Testing
        this.settingsService.toggleAllTags().subscribe(() => {
            this.allStatefulTagsObservable = this.settingsService.allStatefulTags(); // TODO
            this.reloadEntries(this.languagePair);
        });
    }

    submitEntry(wordEntry: WordEntry) {
        if (this.editedEntryId === undefined) { // adding a new Entry
            this.dataProviderFactory.dataProviderInUse().addWordEntry(wordEntry)
                .subscribe(() => this.resetCacheAndReloadEntries(this.languagePair));
        } else { // submitting changes to an existing Entry
            this.dataProviderFactory.dataProviderInUse().updateWordEntry(this.editedEntryId, wordEntry)
                .subscribe(() => this.resetCacheAndReloadEntries(this.languagePair));
            this.editedEntryId = undefined;
        }
    }

    // TODO simplify args
    removeEntry(entry: WordEntry, _index: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(entry.id)
            .subscribe(() => this.resetCacheAndReloadEntries(this.languagePair));
    }

    editEntry(entry: WordEntry, index: number) {
        this.editedEntryId = entry.id;
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

        this.reloadLanguagePairAndEntries();
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

        this.reloadLanguagePairAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
    }
}
