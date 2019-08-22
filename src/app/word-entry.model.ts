export class WordEntry {
    constructor(
        public userId: number,
        public id: number,
        public from: number,
        public to: number,
        public word: string,
        public translations: string[],
        public score: number,
        public tags: string[]
    ) {}
}

export class EditedWordEntry {
    constructor(
        public word: string,
        public translations: string[],
        public tags: string[]
    ) {}
}
