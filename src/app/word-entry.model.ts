export class WordEntry {
    constructor(
        public id: number,
        public from: number,
        public to: number,
        public word: string,
        public translations: string[],
        public score: number,
        public tags: string[]
    ) {}
}
