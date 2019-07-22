import { WordEntry } from './word-entry.model';

class LanguageContainer {
    constructor(public language: number) {}
    isFor(language: number) {
        return this.language == language;
    }
}

export class Source extends LanguageContainer {
    constructor(language: number, public destinations: Destinations) {
        super(language);
    }
}

export class Destination extends LanguageContainer {
    constructor(language: number, public wordsList: WordEntry[]) {
        super(language);
    }
}

class Destinations {
    constructor(private destinations: Destination[] = []) {}

    to(language: number): WordEntry[] {
        for (let destination of this.destinations) {
            if (destination.isFor(language)) {
                return destination.wordsList;
            }
        }
        // Not found => create
        const newDestination = new Destination(language, []);
        this.destinations.push(newDestination);
        return newDestination.wordsList;
    }
}

export class Dictionary {
    constructor(private sources: Source[] = []) {}

    from(language: number): Destinations {
        for (let source of this.sources) {
            if (source.isFor(language)) {
                return source.destinations;
            }
        }
        // Not found => create
        const newSource = new Source(language, new Destinations());
        this.sources.push(newSource);
        return newSource.destinations;
    }

    add(...words: WordEntry[]) {
        for (let word of words) {
            this.from(word.from)
                .to  (word.to)
                .push(word);
        }
    }
}
