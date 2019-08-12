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
    word: string = "";
    translations: string = "";
    tags: string = "";

    editingExistingEntry: boolean;

    @Input() languagePair: LanguagePair;
    @Output() submitEntry = new EventEmitter<WordEntry>();

    private displayEntrySubscription: any;
    @Input() events: Observable<WordEntry>;

    constructor() {}
    ngOnInit() {
        this.displayEntrySubscription = this.events.subscribe((entry: WordEntry) => {
            this.editingExistingEntry = true;
            this.word = entry.word;
            this.translations = entry.translations.join(";");
            this.tags = entry.tags.join(";");
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
        const fakeId = -1;
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        const from = this.languagePair.src;
        const to = this.languagePair.dst;
        const score = 0;
        const newWordEntry = new WordEntry(fakeId, from, to, this.word, translations, score, tags);
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
        this.editingExistingEntry = false;
    }
}
