import { Subject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ViewChild, Component } from '@angular/core';

import { WordEntry, EditedWordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { EntriesDatabaseService } from '../entries-database.service';
import { SettingsService, StatefulTag } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';

import { EditedWordEntryComponent } from '../edited-word-entry/edited-word-entry.component';


@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent {
    // To be able to call its 'clear()' method
    @ViewChild(EditedWordEntryComponent, {static: false}) editedWordEntryComponent;

    entries: Observable<WordEntry[]>;
    languages: string[];
    languagePair: LanguagePair;
    primaryLanguage: string;
    secondaryLanguage: string;
    allStatefulTagsObservable: Observable<StatefulTag[]>;

    private displayEditedEntry = new Subject<EditedWordEntry>(); // to child component

    editedEntryId?: number;
    editedEntryScore?: number;

    // We have a separate boolean variable because we want the text to remain
    // there for the whole duration of the fade-out animation.
    errorDescription: string = "stuff";
    displayErrorDescription: boolean = false;

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

    private entryUnique(targetWord: string, exceptForId?: number): Observable<boolean> {
        return this.entries.pipe(map(entries => {
                const result = entries.find(({ word }) => word == targetWord);
                console.log('Found ', result);
                if (!result) return true;
                return result.id === exceptForId; // takes case of undefined exceptForId
            }));
    }

    submitEntry({ word, translations, tags }: EditedWordEntry) {
        this.entryUnique(word, this.editedEntryId).subscribe(unique => {
            if (!unique) {
                this.errorDescription = "Entry with such word already exists!";
                this.displayErrorDescription = true;
                setTimeout(() => this.displayErrorDescription = false, 3000); // TODO
                return;
            }

            if (this.editedEntryId === undefined) { // adding a new Entry
                this.dataProviderFactory.dataProviderInUse()
                    .addWordEntry(this.languagePair, word, translations, tags)
                    .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
            } else { // submitting changes to an existing Entry
                this.dataProviderFactory.dataProviderInUse()
                    .updateWordEntry(this.editedEntryId, this.languagePair,
                                     word, translations, this.editedEntryScore, tags)
                    .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
                this.editedEntryId = undefined;
                this.editedEntryScore = undefined;
            }

            this.editedWordEntryComponent.clear();
        });
        // if (!this.entryUnique(word, this.editedEntryId)) {
        //     this.errorDescription = "Entry with such word already exists!";
        //     this.displayErrorDescription = true;
        //     setTimeout(() => this.displayErrorDescription = false, 3000); // TODO
        //     return;
        // }
        //
        // if (this.editedEntryId === undefined) { // adding a new Entry
        //     this.dataProviderFactory.dataProviderInUse()
        //         .addWordEntry(this.languagePair, word, translations, tags)
        //         .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
        // } else { // submitting changes to an existing Entry
        //     this.dataProviderFactory.dataProviderInUse()
        //         .updateWordEntry(this.editedEntryId, this.languagePair,
        //                          word, translations, this.editedEntryScore, tags)
        //         .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
        //     this.editedEntryId = undefined;
        //     this.editedEntryScore = undefined;
        // }
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
