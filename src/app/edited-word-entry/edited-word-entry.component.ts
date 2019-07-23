import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-edited-word-entry',
    templateUrl: './edited-word-entry.component.html',
    styleUrls: ['./edited-word-entry.component.css']
})
export class EditedWordEntryComponent implements OnInit {
    word: string = "";
    translations: string = "";
    tags: string = "";

    constructor() {}
    ngOnInit() {}

    canSubmit(): boolean {
        return (this.word.trim().length > 0) && (this.translations.trim().length > 0);
    }

    submit() {
        const translations = this.translations.split(';');
        const tags = this.tags.length == 0 ? [] : this.tags.split(';');
        // TODO
    }
}
