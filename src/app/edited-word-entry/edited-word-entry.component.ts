import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { LanguagePair } from '../language-pair.model';
import { WordEntry } from '../word-entry.model';

import { Observable } from 'rxjs';

@Component({
    selector: 'edited-word-entry',
    templateUrl: './edited-word-entry.component.html',
    styleUrls: ['./edited-word-entry.component.css']
})
export class EditedWordEntryComponent implements OnInit, OnDestroy {
    id: number;
    score: number;

    // [(ngModel)]
    word: string;
    translations: string;
    tags: string;

    editingExistingEntry: boolean;

    @Input() languagePair: LanguagePair;

    @Output() submitEntry = new EventEmitter<WordEntry>();

    private displayEntrySubscription: any;
    @Input() events: Observable<WordEntry>;

    constructor() {
        this.clear();
    }

    ngOnInit() {
        this.displayEntrySubscription = this.events.subscribe(({id, word, translations, score, tags}: WordEntry) => {
            // We assume that the LanguagePair of the requested to edit WordEntry conicides
            // with the LanguagePair we receive as the @Input from our parent.
            this.editingExistingEntry = true;

            this.id = id;
            this.word = word;
            this.translations = translations.join(";");
            this.score = score;
            this.tags = tags.join(";");
        });
    }

    ngOnDestroy() {
        this.displayEntrySubscription.unsubscribe();
    }

    canSubmit(): boolean {
        return (this.word.trim().length > 0) && (this.translations.trim().length > 0);
    }

    canDiscard(): boolean {
        return (this.word.length > 0) || (this.translations.length > 0) || (this.tags.length > 0);
    }

    submit() {
        const fakeUserId = -1;
        const fakeId = -1;
        const {src, dst} = this.languagePair;
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        const newWordEntry = new WordEntry(fakeUserId, fakeId, src, dst,
            this.word, translations, this.score, tags);
        this.submitEntry.emit(newWordEntry);
        this.clear();
    }

    discard() {
        this.clear();
    }

    private clear() {
        this.word = "";
        this.translations = "";
        this.tags = "";
        this.id = -1;
        this.score = 0;
        this.editingExistingEntry = false;
    }
}
