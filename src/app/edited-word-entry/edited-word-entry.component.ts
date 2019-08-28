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
    public word: string;
    public translations: string;
    public tags: string;

    public editingExistingEntry: boolean;

    @Output() public submitEntry = new EventEmitter<EditedWordEntry>();
    @Input() public events: Observable<EditedWordEntry>;
    private displayEntrySubscription: any;

    constructor() { this.clear(); }

    public ngOnInit() {
        this.displayEntrySubscription = this.events.subscribe(({ word, translations, tags }: EditedWordEntry) => {
            this.editingExistingEntry = true;

            this.word = word;
            this.translations = translations.join(";");
            this.tags = tags.join(";");
        });
    }

    public ngOnDestroy() {
        this.displayEntrySubscription.unsubscribe();
    }

    public canSubmit(): boolean {
        return (this.word.trim().length > 0) && (this.translations.trim().length > 0);
    }

    public canDiscard(): boolean {
        return (this.word.length > 0) || (this.translations.length > 0) || (this.tags.length > 0);
    }

    public submit() {
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        const newWordEntry = new EditedWordEntry(this.word, translations, tags);
        this.submitEntry.emit(newWordEntry);
    }

    public discard() {
        this.clear();
    }

    private clear() {
        this.word = "";
        this.translations = "";
        this.tags = "";
        this.editingExistingEntry = false;
    }
}
