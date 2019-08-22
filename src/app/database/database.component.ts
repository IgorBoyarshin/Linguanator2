import { Subject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Component } from '@angular/core';

import { WordEntry, EditedWordEntry } from '../word-entry.model';
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
    languagePair: LanguagePair;
    primaryLanguage: string;
    secondaryLanguage: string;
    allStatefulTagsObservable: Observable<StatefulTag[]>;

    private displayEditedEntry = new Subject<EditedWordEntry>(); // to child component

    editedEntryId?: number;
    editedEntryScore?: number;

    private languageIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private entriesDatabaseService: EntriesDatabaseService,
            private settingsService: SettingsService) {
        this.reloadLanguageIndexerAndLanguages();
        this.reloadLanguagePairAndTagsAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
        this.allStatefulTagsObservable = settingsService.allStatefulTags();
    }

    private reloadLanguageIndexerAndLanguages() {
        this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
            this.languageIndexer = languageIndexer;
            this.languages = this.languageIndexer.allNames();
        });
    }

    private reloadLanguagePairAndTagsAndEntries() {
        this.settingsService.languagePairInUse().subscribe(languagePair => {
            this.languagePair = languagePair;
            this.reloadTagsAndEntries(languagePair);
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

    private reloadTagsAndEntries(languagePair: LanguagePair) {
        this.allStatefulTagsObservable = this.settingsService.allStatefulTags();
        this.settingsService.allStatefulTags().subscribe(statefulTags => {
            this.entries = this.entriesDatabaseService.entriesForWithStatefulTags(languagePair, statefulTags)
                .pipe(map(entries => entries.reverse()));
        });
    }

    private resetCacheAndReloadTagsAndEntries(languagePair: LanguagePair) {
        this.entriesDatabaseService.resetCache();
        this.settingsService.resetTagsCache();
        this.reloadTagsAndEntries(languagePair);
    }

    toggleTag({tag, checked}: StatefulTag) {
        this.settingsService.setTagState(tag, !checked).subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    toggleAllTags() {
        this.settingsService.toggleAllTags().subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    submitEntry({ word, translations, tags }: EditedWordEntry) {
        if (this.editedEntryId === undefined) { // adding a new Entry
            this.dataProviderFactory.dataProviderInUse()
                .addWordEntry(this.languagePair, word, translations, tags)
                .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
        } else { // submitting changes to an existing Entry
            this.dataProviderFactory.dataProviderInUse()
                .updateWordEntry(this.editedEntryId, this.languagePair, word, translations, this.editedEntryScore, tags)
                .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
            this.editedEntryId = undefined;
            this.editedEntryScore = undefined;
        }
    }

    removeEntry(id: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(id)
            .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
    }

    editEntry({ id, word, translations, score, tags }: WordEntry) {
        this.editedEntryId = id;
        this.editedEntryScore = score;
        this.displayEditedEntry.next(new EditedWordEntry(word, translations, tags));
    }

    changeSrcLanguageTo(language: string) {
        this.settingsService.changeSrcLanguageTo(language);
        this.reloadLanguagePairAndTagsAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
    }

    changeDstLanguageTo(language: string) {
        this.settingsService.changeDstLanguageTo(language);
        this.reloadLanguagePairAndTagsAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
    }
}
