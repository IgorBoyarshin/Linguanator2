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

    constructor(
            dataProviderFactory: DataProviderFactoryService,
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
        // XXX: In future must account for both directions
        return this.languagePair ? this.languageIndexer.nameOf(this.languagePair.src) : "";
    }

    private maybeLanguageDst(): string {
        // XXX: In future must account for both directions
        return this.languagePair ? this.languageIndexer.nameOf(this.languagePair.dst) : "";
    }

    submit() {
        if (this.state == State.UserInput) { // Accept answer and display the result
            this.userInput = this.userInput.trim();
            if (this.userInput.length == 0) return;

            const answers = this.userInput.split(';');
            const correctAnswers = this.wordEntry.translations;

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
            });
    }

    // TODO XXX: the content of the wordEntry reference is changed here.
    // Database does not know explicitly about this change.......
    private updateDeltaBy(wordEntry: WordEntry, delta: number) {
        wordEntry.score += delta;
        if (wordEntry.score < 0) {
            wordEntry.score = 0;
        }
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
        str = str.toLowerCase();
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

    // TODO: currently more or less duplicates the code from Database
    changeSrcLanguageTo(language: string) {
        const newSrc = this.languageIndexer.indexOf(language);
        if (newSrc == this.languagePair.dst) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const dst = this.languagePair.dst;
            this.settingsService.setLanguagePairTo(new LanguagePair(newSrc, dst));
        }

        this.reloadEntry();
    }

    // TODO: currently more or less duplicates the code from Database
    changeDstLanguageTo(language: string) {
        const newDst = this.languageIndexer.indexOf(language);
        if (newDst == this.languagePair.src) {
            this.settingsService.flipLanguagePairInUse();
        } else {
            const src = this.languagePair.src;
            this.settingsService.setLanguagePairTo(new LanguagePair(src, newDst));
        }

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
}
