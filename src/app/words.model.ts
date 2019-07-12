export class Source {
    constructor(public language: string, public destinations: Destination[]) {}
    isFor(language: string) {
        return this.language == language;
    }

    // destinationsFor(language: string) {
    //     for (let destination of this.destinations) {
    //         if (destination.isFor(language)) {
    //             return destination;
    //         }
    //     }
    // }
}

export class Destination {
    constructor(public language: string, public wordsList: WordEntry[]) {}
    isFor(language: string) {
        return this.language == language;
    }
}

export class Words {
    sources: Source[];

    from(language: string): Destination[] {
        for (let source of sources) {
            if (source.isFor(language)) {
                return source.destinations;
            }
        }
    }

    to(language: string): WordEntry[] {
        for (let destination of destinations) {
            if (destination.isFor(language)) {
                return destination.wordsList;
            }
        }
    }
}
