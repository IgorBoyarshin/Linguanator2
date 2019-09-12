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
    private languageEntries: Observable<LanguageEntry[]>;

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

}
