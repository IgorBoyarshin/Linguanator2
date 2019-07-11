import { Injectable } from '@angular/core';

import { LanguagePair } from './language-pair.model';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private languages: string[];
    private currentLanguagePair: LanguagePair;

    constructor() {
        this.languages = [
            "English",
            "German"
        ];
        this.currentLanguagePair = new LanguagePair(
            this.indexOfLanguage("English"),
            this.indexOfLanguage("German")
        );
    }

    languagePairInUse(): LanguagePair {
        return this.currentLanguagePair;
    }

    indexOfLanguage(language: string): number {
        const result = this.indexOfStringIn(language, this.languages);
        if (result === undefined) {
            console.error("Language '", language, "' doesn't exist!");
            return -1;
        }
        return result;
    }

    languageForIndex(index: number): string {
        const result = this.stringAtIndexIn(index, this.languages);
        if (result === undefined) {
            console.error("Index of language ", index, " is indalid!");
            return "<INVALID LANGUAGE>";
        }
        return result;
    }

    private indexOfStringIn(str: string, arr: any): number | undefined {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == str) {
                return i;
            }
        }
        return undefined;
    }

    private stringAtIndexIn(index: number, arr: any): string | undefined {
        if (index >= arr.length) {
            return undefined;
        }
        return arr[index];
    }
}
