import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { WordsDatabaseService } from '../words-database.service';
import { SettingsService } from '../settings.service';
import { DataProviderFactoryService } from '../data-provider-factory.service';

enum State {
    UserInput,
    DisplayResult,
}

@Component({
    selector: 'app-testing',
    templateUrl: './testing.component.html',
    styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {
    private wordEntry: WordEntry;
    private languagePair: LanguagePair;
    private state: State;

    private languageIndexer: LanguageIndexer;

    constructor(
            dataProviderFactory: DataProviderFactoryService,
            private wordsDatabaseService: WordsDatabaseService,
            private settingsService: SettingsService) {
        this.languageIndexer = dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer();
    }

    ngOnInit() {
        this.state = State.UserInput;
        this.languagePair = this.settingsService.languagePairInUse();
        const randomWord = this.wordsDatabaseService.randomWordEntryFor(this.languagePair);
        if (randomWord) {
            this.wordEntry = randomWord;
        }
    }

    maybeLanguageSrc(): string {
        // XXX: In future must account for both directions
        return this.languagePair ? this.languageIndexer.nameOf(this.languagePair.src) : "";
    }

    submitInput() {
        this.state = State.DisplayResult;
    }

    submitButtonText(): string {
        return (this.state == State.UserInput) ? "Submit" : "Next";
    }

    textareaDisabled(): boolean {
        return this.state != State.UserInput;
    }
}
