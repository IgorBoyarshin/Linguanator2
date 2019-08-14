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
    constructor(language: number, public entriesList: WordEntry[]) {
        super(language);
    }
}

class Destinations {
    constructor(private destinations: Destination[] = []) {}

    to(language: number): WordEntry[] {
        for (let destination of this.destinations) {
            if (destination.isFor(language)) {
                return destination.entriesList;
            }
        }
        // Not found => create
        const newDestination = new Destination(language, []);
        this.destinations.push(newDestination);
        return newDestination.entriesList;
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

    add(...entries: WordEntry[]) {
        for (let entry of entries) {
            this.from(entry.from)
                .to  (entry.to)
                .push(entry);
        }
    }

    clear() {
        this.sources = [];
    }
}
