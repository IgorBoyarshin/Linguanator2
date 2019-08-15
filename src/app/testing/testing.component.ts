import { Observable } from 'rxjs'
import { combineLatest } from 'rxjs';

import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { EntriesDatabaseService } from '../entries-database.service';
import { SettingsService, StatefulTag } from '../settings.service';
import { DataProviderFactoryService } from '../providers/data-provider-factory.service';

enum State {
    UserInput,
    DisplayResult,
}

enum Match {
    Full = 0,
    Partial,
    Insufficient
}

class EvaluationStats {
    full:         number = 0;
    partial:      number = 0;
    insufficient: number = 0;

    constructor(matches: Match[]) {
        for (let match of matches) {
            switch(match) {
                case Match.Full:         this.full++;         break;
                case Match.Partial:      this.partial++;      break;
                case Match.Insufficient: this.insufficient++; break;
                default: console.error('Unknown Match');
            }
        }
    }
}

@Component({
    selector: 'app-testing',
    templateUrl: './testing.component.html',
    styleUrls: ['./testing.component.css'],
    host: {
        '(document:keydown)': 'handleKeyPress($event)'
    }
})
export class TestingComponent {
    userInput: string = "";
    wordEntry: WordEntry;
    languagePair: LanguagePair;
    state: State;

    statefulTags: StatefulTag[];

    result: Match | undefined = undefined;
    resultDelta: number;

    private languageIndexer: LanguageIndexer;
    languages: string[];

    doTestBothWays: boolean = true;
    testingReverse: boolean;

    constructor(
            private dataProviderFactory: DataProviderFactoryService,
            private entriesDatabaseService: EntriesDatabaseService,
            private settingsService: SettingsService) {
        dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer()
            .subscribe(languageIndexer => {
                this.languageIndexer = languageIndexer;
                this.languages = languageIndexer.allNames();
            });
        this.reloadEntry();
        this.state = State.UserInput;
    }

    private maybeLanguageSrc(): string {
        if (!this.languagePair) return "";
        const target = this.testingReverse ? this.languagePair.dst : this.languagePair.src;
        return this.languageIndexer.nameOf(target);
    }

    private maybeLanguageDst(): string {
        if (!this.languagePair) return "";
        const target = this.testingReverse ? this.languagePair.src : this.languagePair.dst;
        return this.languageIndexer.nameOf(target);
    }

    submit() {
        if (this.state == State.UserInput) { // Accept answer and display the result
            this.userInput = this.userInput.trim();
            if (this.userInput.length == 0) return;

            const answers = this.userInput.split(';');
            const correctAnswers = this.testingReverse ? [this.wordEntry.word] : this.wordEntry.translations;

            const evaluationStats = this.checkAnswers(answers, correctAnswers);
            const delta = this.scoreDeltaFromStats(evaluationStats);
            this.result = this.resultOf(evaluationStats);
            this.updateDeltaBy(this.wordEntry, delta);
            this.resultDelta = delta;

            this.state = State.DisplayResult;
        } else if (this.state == State.DisplayResult) { // Go to the next Test
            this.state = State.UserInput;
            this.userInput = "";
            this.result = undefined;
            this.resultDelta = 0;
            this.reloadEntry();
        }
    }

    private reloadEntry() {
        combineLatest(this.settingsService.languagePairInUse(), this.settingsService.allStatefulTags())
            .subscribe(([languagePair, statefulTags]) => {
                this.languagePair = languagePair;
                this.statefulTags = statefulTags;
                this.entriesDatabaseService.randomWordEntryForWithStatefulTags(languagePair, statefulTags)
                    .subscribe(entry => this.wordEntry = entry);
                if (this.doTestBothWays) this.testingReverse = Math.random() < 0.5;
                else                     this.testingReverse = false;
            });
    }

    private updateDeltaBy(wordEntry: WordEntry, delta: number) {
        wordEntry.score += delta;
        if (wordEntry.score < 0) {
            wordEntry.score = 0;
        }
        // The following may result in a loss of score points if the same entry
        // is used for testing 2 times in a row and the update request has not
        // reached the database yet. This can be remedied by using a cached
        // entries database (such that the subsequent request to which is
        // already aware of the changes).
        // Although possible, the scenario is made less likely by the fact that
        // we are in the result state for some time and hopefully that timespan
        // is enough for the update request to reach its destination.
        this.dataProviderFactory.dataProviderInUse()
            .updateWordEntry(wordEntry.id, wordEntry).subscribe(() => {});
    }

    private resultOf({full, partial, insufficient}: EvaluationStats): Match {
        if (full + partial < insufficient) {
            return Match.Insufficient;
        } else {
            if (partial > 0) return Match.Partial;
            else             return Match.Full;
        }
    }

    private checkAnswers(answers: string[], correctAnswers: string[]): EvaluationStats {
        const evaluate = answer => this.evaluateMatchOfIn(answer, correctAnswers);
        return new EvaluationStats(answers.map(evaluate));
    }

    private evaluateMatchOfIn(str: string, array: string[]): Match {
        // Trim only _str_ because _array_ supposedly contains only the reference
        // (copletely valid) answers that are already trimmed.
        str = str.trim().toLowerCase();
        array = array.map(str => str.toLowerCase());

        if (array.includes(str)) {
            return Match.Full;
        } else if (array.some(element => this.closeEnough(str, element))) {
            return Match.Partial;
        } else {
            return Match.Insufficient;
        }
    }

    private scoreDeltaFromStats({full, partial, insufficient}: EvaluationStats): number {
        return this.calculateScore(insufficient, full + partial);
    }

    private calculateScore(wrong: number, correct: number): number {
        return this.round(Math.pow(correct, 3.0 / 4.0) - wrong);
    }

    private round(x: number): number {
        return +this.roundToStr(x);
    }

    private roundToStr(x: number): string {
        return (Math.floor(x * 100.0) / 100.0).toFixed(2);
    }

    // 1 mistake is allowed
    private closeEnough(str1: string, str2: string): boolean {
        if (str1 == str2) return true;

        if (str1.length == str2.length) {
            return this.differInOnePlace(str1, str2);
        } else if (str1.length == str2.length - 1) {
            return this.isStrPartOf(str1, str2);
        } else if (str1.length == str2.length + 1) {
            return this.isStrPartOf(str2, str1);
        }

        return false;
    }

    private differInOnePlace(str1: string, str2: string): boolean {
        let mistakeFound: boolean = false;
        for (let i = 0; i < str1.length; i++) {
            if (str1.charAt(i) != str2.charAt(i)) {
                if (mistakeFound) return false;
                mistakeFound = true;
            }
        }

        return true;
    }

    private isStrPartOf(subStr: string, str: string): boolean {
        let mistakeFound = false;
        for (let i = 1; i <= subStr.length; i++) {
            const char1 = subStr.charAt(i - 1);
            const char2 = str.charAt((i - 1) + (mistakeFound ? +1 : 0));
            if (char1 != char2) {
                if (mistakeFound) return false;
                mistakeFound = true;
                i--;
            }
        }

        return true;
    }

    changeSrcLanguageTo(language: string) {
        this.settingsService.changeSrcLanguageTo(language);
        this.reloadEntry();
    }

    changeDstLanguageTo(language: string) {
        this.settingsService.changeDstLanguageTo(language);
        this.reloadEntry();
    }

    submitButtonText(): string {
        return (this.state == State.UserInput) ? "Submit" : "Next";
    }

    textareaDisabled(): boolean {
        return this.state != State.UserInput;
    }

    private handleKeyPress(event: KeyboardEvent) {
        if (event.keyCode == 13) { // Enter
            if (this.state == State.DisplayResult) {
                this.submit();

                setTimeout(() => document.getElementById("testing-user-input").focus(), 80);
                event.stopPropagation();
            }
        }
    }

    resultIs(match: Match): boolean {
        return (this.result === match);
    }

    resultIsFull(): boolean {
        return this.resultIs(Match.Full);
    }

    resultIsPartial(): boolean {
        return this.resultIs(Match.Partial);
    }

    resultIsInsufficient(): boolean {
        return this.resultIs(Match.Insufficient);
    }

    doDisplayResult(): boolean {
        return this.state == State.DisplayResult;
    }

    toggleTag({tag, checked}: StatefulTag) {
        this.settingsService.setTagState(tag, !checked).subscribe(() => this.reloadEntry());
    }

    toggleAllTags() {
        this.settingsService.toggleAllTags().subscribe(() => this.reloadEntry());
    }

    toggleTestBothWays() {
        this.doTestBothWays = !this.doTestBothWays;
        if (this.state == State.UserInput) {
            if (this.testingReverse && !this.doTestBothWays) this.reloadEntry();
        }
    }

    translationSrc(): string {
        if (!this.wordEntry) return "";
        if (this.testingReverse) return this.wordEntry.translations.join("; ");
        else                     return this.wordEntry.word;
    }

    translationDst(): string {
        if (!this.wordEntry) return "";
        if (this.testingReverse) return this.wordEntry.word;
        else                     return this.wordEntry.translations.join("; ")
    }
}
