import { Component } from '@angular/core';

import { Observable, of, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { DataProviderFactoryService } from '../providers/data-provider-factory.service';
import { SettingsService } from '../settings.service';

class LanguageEntry {
    constructor(
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
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
    public languageEntries: Observable<LanguageEntry[]>;

    public tagEntries: Observable<TagEntry[]>;

    private selectedLanguageIndex: number; // common
    public selectedLanguageName: string; // determines the pop-up's visibility
    public editedLanguageName: string; // determines the pop-up's visibility
    public selectedLanguageTotalWordsCount: number; // only for Removal

    private selectedTagIndex: number; // common
    public selectedTagName: string; // determines the pop-up's visibility
    public editedTagName: string; // determines the pop-up's visibility
    public selectedTagTotalWordsCount: number; // only for Removal

    constructor(
        private dataProviderFactory: DataProviderFactoryService,
        private settingsService: SettingsService
    ) {
        this.languageEntries = combineLatest(
            this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer(),
            this.dataProviderFactory.dataProviderInUse().retrieveEntries()
        ).pipe(map(([languageIndexer, entries]) =>
            languageIndexer.allIds().map(id => {
                const name = languageIndexer.nameOf(id);
                const wordsCountFrom = entries.filter(({ from }) => from == id).length;
                const wordsCountTo   = entries.filter(({ to   }) => to   == id).length;
                const totalWordsCount = wordsCountFrom + wordsCountTo;
                return new LanguageEntry(name, wordsCountFrom, wordsCountTo, totalWordsCount);
            })
        ));

        this.tagEntries = combineLatest(
            this.settingsService.allTags(),
            this.dataProviderFactory.dataProviderInUse().retrieveEntries(),
            this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer()
        ).pipe(map(([allTags, entries, languageIndexer]) =>
            allTags.map(tagName => {
                const wordsCountInLanguages = languageIndexer.allIds().map(id =>
                    entries.filter(({ tags }) => tags.includes(tagName))
                           .filter(({ from }) => from == id)
                           .length
                );
                const totalWordsCount = wordsCountInLanguages.reduce((acc, curr) => acc + curr, 0);
                return new TagEntry(tagName, wordsCountInLanguages, totalWordsCount)
            })
        ));
    }

    public editLanguage({ name }: LanguageEntry, index: number) {
        this.editedLanguageName = name;
        this.selectedLanguageIndex = index;
    }

    public onConfirmLanguageRename(newName: string) {
        console.log('Renaming language to ', newName);
        // TODO
        this.onCancelLanguageRename(); // clean-up
    }

    public onCancelLanguageRename() {
        this.editedLanguageName = null;
        this.selectedLanguageIndex = null;
    }

    public removeLanguage({ name, totalWordsCount }: LanguageEntry, index: number) {
        this.selectedLanguageName = name;
        this.selectedLanguageTotalWordsCount = totalWordsCount;
        this.selectedLanguageIndex = index;
    }

    public onConfirmLanguageRemoval() {
        console.log('Removing language');
        // TODO
        this.onCancelLanguageRemoval(); // clean-up
    }

    public onCancelLanguageRemoval() {
        this.selectedLanguageName = null;
        this.selectedLanguageTotalWordsCount = null;
        this.selectedLanguageIndex = null;
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
}
