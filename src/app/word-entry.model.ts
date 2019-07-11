export class WordEntry {
    constructor(
        public form: number,
        public to: number,
        public word: string,
        public translations: string[],
        public score: number,
        public tags: string[]
    ) {}
}
