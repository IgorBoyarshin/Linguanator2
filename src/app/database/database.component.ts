import { Subject, Observable } from 'rxjs';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Component } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { EntriesDatabaseService } from '../entries-database.service';
import { SettingsService, StatefulTag } from '../settings.service';
import { LanguageIndexer } from '../language-indexer';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';
// import { AuthService } from '../auth/auth.service';


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
            // private authService: AuthService,
            private dataProviderFactory: DataProviderFactoryService,
            private entriesDatabaseService: EntriesDatabaseService,
            private settingsService: SettingsService) {
        // this.authService.logoutNotificator().subscribe(() => this.selfReset());

        this.reloadLanguageIndexerAndLanguages();
        this.reloadLanguagePairAndTagsAndEntries();
        this.reloadPrimaryAndSecondaryLanguages();
        this.allStatefulTagsObservable = settingsService.allStatefulTags();
    }

    // ngOnInit() {
    //     console.log('inittiing....................');
    // }
    // ngOnDestroy() {
    //     console.log('destroying....................');
    // }

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

    // private selfReset() {
    //     this.entries = null;
    //     this.languageIndexer = null
    //     this.languages = null;
    //     this.languagePair = null;
    //     this.primaryLanguage = null;
    //     this.secondaryLanguage = null;
    //     this.allStatefulTagsObservable = null;
    //     this.editedEntryId = null;
    // }

    private resetCacheAndReloadTagsAndEntries(languagePair: LanguagePair) {
        this.entriesDatabaseService.resetCache();
        this.settingsService.resetCache();
        this.reloadTagsAndEntries(languagePair);
    }

    toggleTag({tag, checked}: StatefulTag) {
        this.settingsService.setTagState(tag, !checked).subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    toggleAllTags() {
        this.settingsService.toggleAllTags().subscribe(() => this.reloadLanguagePairAndTagsAndEntries());
    }

    submitEntry(wordEntry: WordEntry) {
        if (this.editedEntryId === undefined) { // adding a new Entry
            const { word, translations, tags } = wordEntry; // TODO
            this.dataProviderFactory.dataProviderInUse()
                .addWordEntry(this.languagePair, word, translations, tags)
                .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
        } else { // submitting changes to an existing Entry
            const { word, translations, score, tags } = wordEntry; // TODO
            this.dataProviderFactory.dataProviderInUse()
                .updateWordEntry(this.editedEntryId, this.languagePair, word, translations, score, tags)
                .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
            this.editedEntryId = undefined;
        }
    }

    removeEntry(id: number) {
        this.dataProviderFactory.dataProviderInUse().removeWordEntry(id)
            .subscribe(() => this.resetCacheAndReloadTagsAndEntries(this.languagePair));
    }

    editEntry(entry: WordEntry) {
        this.editedEntryId = entry.id;
        this.displayEditedEntry.next(entry);
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
