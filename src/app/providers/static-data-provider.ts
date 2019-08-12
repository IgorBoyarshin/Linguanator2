import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { Language } from '../language-model';
import { LanguageIndexer } from '../language-indexer';

export class StaticDataProvider implements DataProvider {
    private nextWordEntryIdToUse: number = 1;
    private words: WordEntry[]; // TODO: rename to entries
    private languageIndexer: LanguageIndexer;

    constructor() {}

    retrieveWords(): Observable<WordEntry[]> {
        // TODO: Potentially creates multiple Observables, each one sent to query
        // the result and rewrite this.words upon arrival
        if (!this.words) {
            return Observable.create(subscriber => {
                this.retrieveLanguageIndexer().subscribe(languageIndexer => {
                    this.words = this.initWords(languageIndexer);
                    subscriber.next(this.words);
                });
            });
        }
        return of(this.words);
    }

    retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexer) {
            this.languageIndexer = this.initLanguageIndexer();
        }
        return of(this.languageIndexer);
    }

    _addWordEntry({from, to, word, translations, score, tags}: WordEntry) {
        this.words.push(new WordEntry(this.nextWordEntryIdToUse, from, to, word, translations, score, tags));
        this.nextWordEntryIdToUse++;
    }

    addWordEntry(wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            this._addWordEntry(wordEntry);
            this.words.push(wordEntry);
            subscriber.next();
        });
    }

    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            if (!this.indexValidIn(this.words, potentialIndex)) return;
            if (this.words[potentialIndex] === oldEntry) {
                this.words[potentialIndex] = newEntry;
            } else { // deep search
                const index = this.words.indexOf(oldEntry);
                if (index == -1) return; // not found : (
                this.words[index] = newEntry;
            }

            subscriber.next();
        });
    }

    removeWordEntry(potentialIndex: number, wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            // To simulate the delay:
            // setTimeout(() => {
                if (!this.indexValidIn(this.words, potentialIndex)) return;
                if (this.words[potentialIndex] === wordEntry) {
                    this.words.splice(potentialIndex, 1);
                } else { // deep search
                    const index = this.words.indexOf(wordEntry);
                    if (index == -1) return; // not found : (
                    this.words.splice(index, 1);
                }

                subscriber.next();
            // }, 2000);
        });
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }

    private initWords(languageIndexer: LanguageIndexer): WordEntry[] {
        const ger = languageIndexer.indexOf("German");
        const eng = languageIndexer.indexOf("English");
        return [
            new WordEntry(1, ger, eng, 'weit', ['wide', 'far', 'broad'], 2, ['tag1', 'tag2']),
            new WordEntry(2, ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry(3, ger, eng, 'gehorsam', ['obedient', 'submissive'], 1, []),
            new WordEntry(4, ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 1, []),
            new WordEntry(5, ger, eng, 'regungslos', ['motionless', 'dead still'], 1, []),
            new WordEntry(6, ger, eng, 'die Kerze', ['the candle'], 1, []),
            new WordEntry(7, ger, eng, 'zu zweit', ['in pairs'], 1, []),
            new WordEntry(8, ger, eng, 'der Fels', ['the rock', 'the cliff'], 1, []),
            new WordEntry(9, ger, eng, 'kundtun', ['make known', 'proclaim'], 1, []),
            new WordEntry(10, ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 1, []),
            new WordEntry(11, ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 1, []),
            new WordEntry(12, ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 1, []),
            new WordEntry(13, ger, eng, 'die Sünde', ['the sin'], 1, []),
            new WordEntry(14, ger, eng, 'auswendig', ['by heart'], 1, []),
            new WordEntry(15, ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 1, []),
            new WordEntry(16, ger, eng, 'anschauen', ['look at', 'watch', 'view'], 1, []),
            new WordEntry(17, ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 1, []),
            new WordEntry(18, ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 1, []),
            new WordEntry(19, ger, eng, 'leuchten', ['light', 'shine', 'glow'], 1, []),
            new WordEntry(20, ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 1, []),
            new WordEntry(21, ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with somethings'], 1, []),
            new WordEntry(22, ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 1, []),
            new WordEntry(23, ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 1, []),
            new WordEntry(24, ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 1, []),
            new WordEntry(25, ger, eng, 'zur selben Zeit', ['at the same time'], 1, []),
            new WordEntry(26, ger, eng, 'das Gedicht', ['the poem', 'the ode'], 1, []),

            new WordEntry(27, eng, ger, 'the boy', ['der Junge', 'der Knabe'], 3, []),
        ];
    }

    private initLanguageIndexer(): LanguageIndexer {
        const languages = [
            new Language(1, "English"),
            new Language(2, "German"),
        ];
        return new LanguageIndexer(languages);
    }
}
