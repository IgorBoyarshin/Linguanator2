import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { LanguagePair } from '../language-pair.model';
import { EditedWordEntry } from '../word-entry.model';

import { Observable } from 'rxjs';

@Component({
    selector: 'edited-word-entry',
    templateUrl: './edited-word-entry.component.html',
    styleUrls: ['./edited-word-entry.component.css']
})
export class EditedWordEntryComponent implements OnInit, OnDestroy {
    // [(ngModel)]
    word: string;
    translations: string;
    tags: string;

    editingExistingEntry: boolean;

    @Output() submitEntry = new EventEmitter<EditedWordEntry>();
    @Input() events: Observable<EditedWordEntry>;
    private displayEntrySubscription: any;

    constructor() { this.clear(); }

    ngOnInit() {
        this.displayEntrySubscription = this.events.subscribe(({ word, translations, tags }: EditedWordEntry) => {
            this.editingExistingEntry = true;

            this.word = word;
            this.translations = translations.join(";");
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
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        const newWordEntry = new EditedWordEntry(this.word, translations, tags);
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
