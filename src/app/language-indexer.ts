import { Language } from './language-model';

// The purpose of this class is just to provide a wrapper around a list of
// Languages (entities that have an ID and a Name) and to conveniently index them.
export class LanguageIndexer {
    constructor(public languages: Language[]) {}

    public nameOf(id: number): string {
        for (let language of this.languages) {
            if (language.id == id) return language.name;
        }
        console.error("Could not find name of language with id: ", id);
        return '';
    }

    public idOf(name: string): number {
        for (let language of this.languages) {
            if (language.name == name) return language.id;
        }
        console.error("Could not find index of language with name: ", name);
        return -1;
    }

    public allNames(): string[] {
        return this.languages.map(language => language.name);
    }

    public allIds(): number[] {
        return this.languages.map(language => language.id);
    }

    public allLanguages(): Language[] {
        return this.languages;
    }
}
