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
    styleUrls: ['./testing.component.css'],
    host: {
        '(document:keydown)': 'handleKeyPress($event)'
    }
})
export class TestingComponent implements OnInit {
    userInput: string = "";
    wordEntry: WordEntry;
    languagePair: LanguagePair;
    state: State;

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

    private maybeLanguageSrc(): string {
        // XXX: In future must account for both directions
        return this.languagePair ? this.languageIndexer.nameOf(this.languagePair.src) : "";
    }

    submit() {
        if (this.state == State.UserInput) {
            this.userInput = this.userInput.trim();
            if (this.userInput.length > 0) {
                this.state = State.DisplayResult;
            }
        } else if (this.state == State.DisplayResult) {
            this.state = State.UserInput;
            this.userInput = "";
        }
    }

    submitButtonText(): string {
        return (this.state == State.UserInput) ? "Submit" : "Next";
    }

    textareaDisabled(): boolean {
        return this.state != State.UserInput;
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (event.keyCode == 13) { // Enter
            if (this.state == State.DisplayResult) {
                this.submit();

                setTimeout(() => document.getElementById("testing-user-input").focus(), 80);
                event.stopPropagation();
            }
        }
    }
}
