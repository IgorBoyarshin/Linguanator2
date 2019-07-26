import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Component, OnInit } from '@angular/core';

import { LanguagePair } from '../language-pair.model';
import { WordEntry } from '../word-entry.model';

@Component({
    selector: 'edited-word-entry',
    templateUrl: './edited-word-entry.component.html',
    styleUrls: ['./edited-word-entry.component.css']
})
export class EditedWordEntryComponent implements OnInit {
    word: string = "";
    translations: string = "";
    tags: string = "";

    @Input() languagePair: LanguagePair;
    @Output() addWord = new EventEmitter<WordEntry>();

    constructor() {}
    ngOnInit() {}

    canSubmit(): boolean {
        return (this.word.trim().length > 0) && (this.translations.trim().length > 0);
    }

    submit() {
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        const from = this.languagePair.src;
        const to = this.languagePair.dst;
        const score = 0;
        const newWordEntry = new WordEntry(from, to, this.word, translations, score, tags);
        this.addWord.emit(newWordEntry);
        this.clear();
    }

    private clear() {
        this.word = "";
        this.translations = "";
        this.tags = "";
    }
}
