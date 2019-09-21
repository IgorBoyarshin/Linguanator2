import { Component } from '@angular/core';

import { Observable, of, combineLatest } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators';

import { DataProviderFactoryService } from '../providers/data-provider-factory.service';
import { SettingsService } from '../settings.service';
import { EntriesDatabaseService } from '../entries-database.service';

class LanguageEntry {
    constructor(
        public id: number,
        public name: string,
        public wordsCountFrom: number,
        public wordsCountTo: number,
        public totalWordsCount: number
    ) {}
}

class TagEntry {
    constructor(
        public name: string,
        public wordsCountInLanguages: number[],
        public totalWordsCount: number
    ) {}
}


@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
    public languageEntries: Observable<LanguageEntry[]>;

    public tagEntries: Observable<TagEntry[]>;

    private selectedLanguageId: number; // common
    public selectedLanguageName: string; // determines the pop-up's visibility
    public editedLanguageName: string; // determines the pop-up's visibility
    public selectedLanguageTotalWordsCount: number; // only for Removal

    private selectedTagIndex: number; // common
    public selectedTagName: string; // determines the pop-up's visibility
    public editedTagName: string; // determines the pop-up's visibility
    public selectedTagTotalWordsCount: number; // only for Removal


    public unselectedLanguageEntries: Observable<string[]>;

    // This needs to default to false, so that the div gets displayed and so the
    // ul with the for-loop gets displayed and thus the async call gets executed.
    // This variable specifies whether or not to display the addLanguage prompt,
    // or notify the user that he has already selected all available languages.
    public noUnselectedLanguages = false;

    public dropdownOpen: boolean = false;
    public dropdownSelectedName: string;
    public dropdownPress() {
        this.dropdownOpen = !this.dropdownOpen;
        event.stopPropagation();
        return false;
    }
    public dropdownSelectItem(name: string) {
        this.dropdownSelectedName = name;
        this.dropdownOpen = false;
        event.stopPropagation();
        return false;
    }
    public dropdownHeadline(): string {
        if (this.noUnselectedLanguages) {
            return "You have all available languages in your dictionary already!"
        } else {
            return "Add another language to your dictionary: ";
        }
    }
    public dropdownButtonContent(): string {
        if (this.dropdownSelectedName) return this.dropdownSelectedName;
        return "select a language";
    }
    public addLanguage() {
        const languageName = this.dropdownSelectedName;
        this.dropdownOpen = false;
        this.dropdownSelectedName = null;
        this.dataProviderFactory.dataProviderInUse().addSelfLanguage(languageName)
            .subscribe(_ => {
                this.reloadUnselectedEntries();
                this.reloadLanguageEntries();
            }, err => console.error(err));
    }


    private reloadUnselectedEntries() {
        this.unselectedLanguageEntries = combineLatest(
            this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer(),
            this.dataProviderFactory.dataProviderInUse().retrieveAllLanguagesIndexer()
        ).pipe(
            map(([selfLanguagesIndexer, allLanguagesIndexer]) => {
                const usedIds = selfLanguagesIndexer.allIds();
                return allLanguagesIndexer.allLanguages()
                    .filter(({ id }) => !usedIds.includes(id))
                    .map(({ name }) => name);
            }),
            tap(languages => this.noUnselectedLanguages = (languages.length == 0))
        );
    }


    constructor(
        private dataProviderFactory: DataProviderFactoryService,
        private entriesDatabaseService: EntriesDatabaseService,
        private settingsService: SettingsService
    ) {
        this.reloadLanguageEntries();
        this.reloadTagEntries();
        this.reloadUnselectedEntries();
    }


    private reloadLanguageEntries() {
        this.languageEntries = combineLatest(
            this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer(),
            this.dataProviderFactory.dataProviderInUse().retrieveEntries()
        ).pipe(map(([selfLanguagesIndexer, entries]) =>
            selfLanguagesIndexer.allLanguages().map(({ id, name }) => {
                const wordsCountFrom = entries.filter(({ from }) => from == id).length;
                const wordsCountTo   = entries.filter(({ to   }) => to   == id).length;
                const totalWordsCount = wordsCountFrom + wordsCountTo;
                return new LanguageEntry(id, name, wordsCountFrom, wordsCountTo, totalWordsCount);
            })
        ));
    }

    private reloadTagEntries() {
        this.tagEntries = combineLatest(
            this.settingsService.allTags(),
            this.dataProviderFactory.dataProviderInUse().retrieveEntries(),
            this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer()
        ).pipe(map(([allTags, entries, selfLanguagesIndexer]) =>
            allTags.map(tagName => {
                const wordsCountInLanguages = selfLanguagesIndexer.allIds().map(id =>
                    entries.filter(({ tags }) => tags.includes(tagName))
                           .filter(({ from }) => from == id)
                           .length
                );
                const totalWordsCount = wordsCountInLanguages.reduce((acc, curr) => acc + curr, 0);
                return new TagEntry(tagName, wordsCountInLanguages, totalWordsCount)
            })
        ));
    }

    public removeLanguage({ id, name, totalWordsCount }: LanguageEntry) {
        this.selectedLanguageId = id; // needed in onConfirmLanguageRemoval()
        if (totalWordsCount == 0) {
            // Totally safe to remove this language => don't bother confirming
            this.onConfirmLanguageRemoval();
            return;
        }
        this.selectedLanguageName = name;
        this.selectedLanguageTotalWordsCount = totalWordsCount;
    }

    public onConfirmLanguageRemoval() {
        this.dataProviderFactory.dataProviderInUse().removeSelfLanguage(this.selectedLanguageId)
            .subscribe(_ => {
                this.reloadUnselectedEntries();
                this.reloadLanguageEntries();
                this.entriesDatabaseService.resetCache();
            }, err => console.error(err));
        this.onCancelLanguageRemoval(); // clean-up
    }

    public onCancelLanguageRemoval() {
        this.selectedLanguageName = null;
        this.selectedLanguageTotalWordsCount = null;
        this.selectedLanguageId = null;
    }



    public editTag({ name }: TagEntry, index: number) {
        this.editedTagName = name;
        this.selectedTagIndex = index;
    }

    public onConfirmTagRename(newName: string) {
        console.log('Renaming tag to ', newName);
        // TODO
        this.onCancelTagRename(); // clean-up
    }

    public onCancelTagRename() {
        this.editedTagName = null;
        this.selectedTagIndex = null;
    }

    public removeTag({ name, totalWordsCount }: TagEntry, index: number) {
        this.selectedTagName = name;
        this.selectedTagTotalWordsCount = totalWordsCount;
        this.selectedTagIndex = index;
    }

    public onConfirmTagRemoval() {
        console.log('Removing tag');
        // TODO
        this.onCancelTagRemoval(); // clean-up
    }

    public onCancelTagRemoval() {
        this.selectedTagName = null;
        this.selectedTagTotalWordsCount = null;
        this.selectedTagIndex = null;
    }

    public resetDropdowns() {
        this.dropdownOpen = false;
    }
}
