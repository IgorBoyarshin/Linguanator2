import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LanguageIndexerService {
    names: string[];

    constructor() {
        this.names = [
            "English",
            "German"
        ]
    }

    nameOf(index: number): string {
        return this.names[index]; // TODO: perform check??
    }

    indexOf(name: string): number {
        for (let i = 0; i < this.names.length; i++) {
            if (this.names[i] == name) {
                return i;
            }
        }
        console.error("Could not find index of language: ", name);
        return -1;
    }

    allNames(): string[] {
        return this.names;
    }
}
