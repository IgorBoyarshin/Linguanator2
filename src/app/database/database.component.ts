import { Subject, Observable, of } from 'rxjs';
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

    public entries: Observable<WordEntry[]>;
    public languages: string[];
    public languagePair: LanguagePair;
    public primaryLanguage: string;
    public secondaryLanguage: string;
    public allStatefulTagsObservable: Observable<StatefulTag[]>;

    private displayEditedEntry = new Subject<EditedWordEntry>(); // to child component

    public editedEntryId?: number;
    public editedEntryScore?: number;

    // We have a separate boolean variable because we want the text to remain
    // there for the whole duration of the fade-out animation.
    public errorDescription: string = "stuff";
    public displayErrorDescription: boolean = false;

    private selfLanguagesIndexer: LanguageIndexer;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private entriesDatabaseService: EntriesDatabaseService,
            private settingsService: SettingsService) {
        this.reloadSelfLanguagesIndexerAndLanguages();
        this.reloadLanguagePairAndTagsAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
        this.allStatefulTagsObservable = settingsService.allStatefulTags();
    }

    private reloadSelfLanguagesIndexerAndLanguages() {
        this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer().subscribe(selfLanguagesIndexer => {
            this.selfLanguagesIndexer = selfLanguagesIndexer;
            this.languages = this.selfLanguagesIndexer.allNames();
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
                      this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer())
            .subscribe(([languagePair, selfLanguagesIndexer]) => {
                if (languagePair) {
                    this.primaryLanguage = this.selfLanguagesIndexer.nameOf(languagePair.src);
                    this.secondaryLanguage = this.selfLanguagesIndexer.nameOf(languagePair.dst);
                } else {
                    this.primaryLanguage = "---";
                    this.secondaryLanguage = "---";
                }
            });
    }

    private reloadTagsAndEntries(languagePair: LanguagePair) {
        this.allStatefulTagsObservable = this.settingsService.allStatefulTags();
        if (!this.languagePair) return;
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

    public toggleTag({tag, checked}: StatefulTag) {
        this.settingsService.setTagState(tag, !checked).subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    public toggleAllTags() {
        this.settingsService.toggleAllTags().subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    // Allow for multiple empty translations
    private entryUnique(targetWord: string, targetTranslations: string[], exceptForId?: number): Observable<boolean> {
        return this.entries.pipe(map(entries => {
            const result = entries.find(({ word, translations }) =>
                this.lowercaseStringsEqual(word, targetWord) || this.arraysSameButNotEmpty(translations, targetTranslations));
            if (!result) return true;
            return result.id === exceptForId; // takes care of exceptForId being undefined
        }));
    }

    private arraysSameButNotEmpty(a1: string[], a2: string[]): boolean {
        if (a1.length != a2.length) return false;
        if (a1.length == 0) return false; // (a2.length == a1.length)

        for (let i = 0; i < a1.length; i++) {
            if (!this.lowercaseStringsEqual(a1[i], a2[i])) return false;
        }
        return true;
    }

    private lowercaseStringsEqual(str1: string, str2: string): boolean {
        return str1.toLowerCase() == str2.toLowerCase();
    }

    public submitEntry({ word, translations, tags }: EditedWordEntry) {
        if (!this.languagePair) return;
        this.entryUnique(word, translations, this.editedEntryId).subscribe(unique => {
            if (!unique) {
                this.errorDescription = "Entry with such word or translations already exists!";
                this.displayErrorDescription = true;
                setTimeout(() => this.displayErrorDescription = false, 3000);
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
    }

    public removeEntry(id: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(id)
            .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
    }

    public editEntry({ id, word, translations, score, tags }: WordEntry) {
        this.editedEntryId = id;
        this.editedEntryScore = score;
        this.displayEditedEntry.next(new EditedWordEntry(word, translations, tags));
    }

    public changeSrcLanguageTo(language: string) {
        this.settingsService.changeSrcLanguageTo(language).subscribe(_ => {
            this.reloadLanguagePairAndTagsAndEntries();
            this.reloadPrimaryAndSecondaryLanguages();
        });
    }

    public changeDstLanguageTo(language: string) {
        this.settingsService.changeDstLanguageTo(language).subscribe(_ => {
            this.reloadLanguagePairAndTagsAndEntries();
            this.reloadPrimaryAndSecondaryLanguages();
        });
    }

    public displayNoWordsMessage(): Observable<boolean> {
        if (!this.entries) return of(true);
        return this.entries.pipe(map(entries => entries.length == 0));
    }

    public displayInsufficientLanguages(): Observable<boolean> {
        return this.settingsService.insufficientLanguages();
    }
}
