import { DataProvider } from './data-provider';
import { WordEntry } from './word-entry.model';

export class StaticDataProvider extends DataProvider {
    words: WordEntry[];
    // languages: string[];

    constructor() {
        super();
    }

    retrieveWords(): WordEntry[] {
        if (!this.words) {
            // const ger = this.languageIndexer.indexOf("German");
            // const eng = this.languageIndexer.indexOf("English");
            const ger = 1; // TODO
            const eng = 0; // TODO
            this.words = [
                new WordEntry(ger, eng, 'weit', ['wide', 'far', 'broad'], 2, ['tag1', 'tag2']),
                new WordEntry(ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
                new WordEntry(ger, eng, 'gehorsam', ['obedient', 'submissive'], 1, []),
                new WordEntry(ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 1, []),
                new WordEntry(ger, eng, 'regungslos', ['motionless', 'dead still'], 1, []),
                new WordEntry(ger, eng, 'die Kerze', ['the candle'], 1, []),
                new WordEntry(ger, eng, 'zu zweit', ['in pairs'], 1, []),
                new WordEntry(ger, eng, 'der Fels', ['the rock', 'the cliff'], 1, []),
                new WordEntry(ger, eng, 'kundtun', ['make known', 'proclaim'], 1, []),
                new WordEntry(ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 1, []),
                new WordEntry(ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 1, []),
                new WordEntry(ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 1, []),
                new WordEntry(ger, eng, 'die Sünde', ['the sin'], 1, []),
                new WordEntry(ger, eng, 'auswendig', ['by heart'], 1, []),
                new WordEntry(ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 1, []),
                new WordEntry(ger, eng, 'anschauen', ['look at', 'watch', 'view'], 1, []),
                new WordEntry(ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 1, []),
                new WordEntry(ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 1, []),
                new WordEntry(ger, eng, 'leuchten', ['light', 'shine', 'glow'], 1, []),
                new WordEntry(ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'but'], 1, []),
                new WordEntry(ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with somethings'], 1, []),
                new WordEntry(ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 1, []),
                new WordEntry(ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 1, []),
                new WordEntry(ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 1, []),
                new WordEntry(ger, eng, 'zur selben Zeit', ['at the same time'], 1, []),
                new WordEntry(ger, eng, 'das Gedicht', ['the poem', 'the ode'], 1, []),
            ];
        }
        return this.words;
    }

    // retrieveLanguages(): string[] {
    //     if (!this.languages) {
    //         this.languages = [
    //             "English",
    //             "German"
    //         ];
    //     }
    //     return this.languages;
    // }
}
