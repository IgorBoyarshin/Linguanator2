export class WordEntry {
    constructor(
        public word: string,
        public translations: string[],
        public score: number,
        public tags: string[]
    ) {}
}
