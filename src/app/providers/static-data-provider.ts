import { BehaviorSubject } from 'rxjs';
import { of, from } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export class StaticDataProvider implements DataProvider {
    private words: WordEntry[];
    private languageIndexer: LanguageIndexer;

    private wordsSubject: BehaviorSubject<WordEntry[]>;
    private languageIndexerSubject: BehaviorSubject<LanguageIndexer>;

    constructor() {}

    retrieveWords(): BehaviorSubject<WordEntry[]> {
        if (!this.wordsSubject) {
            this.wordsSubject = new BehaviorSubject([]);
            this.retrieveLanguageIndexer().subscribe(languageIndexer => {
                const ger = languageIndexer.indexOf("German");
                const eng = languageIndexer.indexOf("English");
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
                    new WordEntry(ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 1, []),
                    new WordEntry(ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with somethings'], 1, []),
                    new WordEntry(ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 1, []),
                    new WordEntry(ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 1, []),
                    new WordEntry(ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 1, []),
                    new WordEntry(ger, eng, 'zur selben Zeit', ['at the same time'], 1, []),
                    new WordEntry(ger, eng, 'das Gedicht', ['the poem', 'the ode'], 1, []),

                    new WordEntry(eng, ger, 'the boy', ['der Junge', 'der Knabe'], 3, []),
                ];
                this.wordsSubject.next(this.words);
            });
        }
        return this.wordsSubject;
    }

    retrieveLanguageIndexer(): BehaviorSubject<LanguageIndexer> {
        if (!this.languageIndexerSubject) {
            const languages = [
                "English",
                "German"
            ];
            this.languageIndexer = new LanguageIndexer(languages);
            this.languageIndexerSubject = new BehaviorSubject(this.languageIndexer);
        }
        return this.languageIndexerSubject;
    }

    addWordEntry(wordEntry: WordEntry) {
        this.words.push(wordEntry);
        this.wordsSubject.next(this.words);
    }

    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry) {
        if (!this.indexValidIn(this.words, potentialIndex)) return;
        if (this.words[potentialIndex] === oldEntry) {
            this.words[potentialIndex] = newEntry;
        } else { // deep search
            const index = this.words.indexOf(oldEntry);
            if (index == -1) return; // not found : (
            this.words[index] = newEntry;
        }

        this.wordsSubject.next(this.words);
    }

    removeWordEntry(potentialIndex: number, wordEntry: WordEntry) {
        setTimeout(() => {
            if (!this.indexValidIn(this.words, potentialIndex)) return;
            if (this.words[potentialIndex] === wordEntry) {
                this.words.splice(potentialIndex, 1);
            } else { // deep search
                const index = this.words.indexOf(wordEntry);
                if (index == -1) return; // not found : (
                this.words.splice(index, 1);
            }

            this.wordsSubject.next(this.words);
        }, 2000);
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }
}
