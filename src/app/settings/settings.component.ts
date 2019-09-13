import { Component } from '@angular/core';

import { Observable, of, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { DataProviderFactoryService } from '../providers/data-provider-factory.service';

class LanguageEntry {
    constructor(
        public name: string,
        public wordsCountFrom: number,
        public wordsCountTo: number,
        public totalWordsCount: number) {}
}


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
    public languageEntries: Observable<LanguageEntry[]>;

    private selectedLanguageIndex: number; // common
    public selectedLanguageName: string; // determines the pop-up's visibility
    public editedLanguageName: string; // determines the pop-up's visibility
    public selectedLanguageTotalWordsCount: number; // only for Removal

    constructor(
        private dataProviderFactory: DataProviderFactoryService
    ) {
        this.languageEntries = combineLatest(
                this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer(),
                this.dataProviderFactory.dataProviderInUse().retrieveEntries()
            ).pipe(map(([languageIndexer, entries]) =>
                languageIndexer.allIds().map(id => {
                    const name = languageIndexer.nameOf(id);
                    const wordsCountFrom = entries.filter(({ from }) => from == id).length;
                    const wordsCountTo = entries.filter(({ to }) => to == id).length;
                    const totalWordsCount = wordsCountFrom + wordsCountTo;
                    return new LanguageEntry(name, wordsCountFrom, wordsCountTo, totalWordsCount);
                }))
            );
    }

    public editLanguage({ name }: LanguageEntry, index: number) {
        this.editedLanguageName = name;
        this.selectedLanguageIndex = index;
    }

    public onConfirmRename(newName: string) {
        // TODO
        this.onCancelRename(); // clean-up
    }

    public onCancelRename() {
        this.editedLanguageName = null;
        this.selectedLanguageIndex = null;
    }

    public removeLanguage({ name, totalWordsCount }: LanguageEntry, index: number) {
        this.selectedLanguageName = name;
        this.selectedLanguageTotalWordsCount = totalWordsCount;
        this.selectedLanguageIndex = index;
    }

    public onConfirmRemoval() {
        // TODO
        this.onCancelRemoval(); // clean-up
    }

    public onCancelRemoval() {
        this.selectedLanguageName = null;
        this.selectedLanguageTotalWordsCount = null;
        this.selectedLanguageIndex = null;
    }
}
