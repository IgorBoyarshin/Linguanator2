import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { LanguageIndexer } from '../language-indexer';

export class StaticDataProvider implements DataProvider {
    private words: WordEntry[]; // TODO: rename to entries
    private languageIndexer: LanguageIndexer;

    private wordsObservable: Observable<WordEntry[]>;

    constructor() {}

    retrieveWords(): Observable<WordEntry[]> {
        if (!this.words) {
            if (!this.wordsObservable) {
                this.wordsObservable = Observable.create(subscriber => {
                    this.retrieveLanguageIndexer().subscribe(languageIndexer => { // the next(result) function
                        this.words = this.initWords(languageIndexer);
                        subscriber.next(this.words);
                    });
                });
            }
            return this.wordsObservable; // the one already sent to retrieve the result
        }
        return of(this.words);

        // // Potentially creates multiple Observables, each one sent to query the result
        // // and rewrite this.words upon arrival
        // if (!this.words) {
        //     return Observable.create((next) => { // Subscriber's next()
        //         this.retrieveLanguageIndexer().subscribe(languageIndexer => { // the next(result) function
        //             this.words = this.initWords(languageIndexer);
        //             next(this.words);
        //         });
        //     });
        // }
        // return of(this.words);
        //
        //
        // return Observable.create((next) => { // Subscriber's next()
        //     if (!this.words) {
        //         this.retrieveLanguageIndexer().subscribe(languageIndexer => { // the next(result) function
        //             this.words = this.initWords(languageIndexer);
        //             next(this.words); // XXX which one???
        //         });
        //     }
        //     next(this.words); // XXX which one???
        // });
    }

    retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexer) {
            this.languageIndexer = this.initLanguageIndexer();
        }
        return of(this.languageIndexer);
    }

    addWordEntry(wordEntry: WordEntry, onReady: () => void) {
        this.words.push(wordEntry);
        onReady();
    }

    updateWordEntry(potentialIndex: number, oldEntry: WordEntry, newEntry: WordEntry, onReady: () => void) {
        if (!this.indexValidIn(this.words, potentialIndex)) return;
        if (this.words[potentialIndex] === oldEntry) {
            this.words[potentialIndex] = newEntry;
        } else { // deep search
            const index = this.words.indexOf(oldEntry);
            if (index == -1) return; // not found : (
            this.words[index] = newEntry;
        }

        onReady();
    }

    removeWordEntry(potentialIndex: number, wordEntry: WordEntry, onReady: () => void) {
        setTimeout(() => {
            if (!this.indexValidIn(this.words, potentialIndex)) return;
            if (this.words[potentialIndex] === wordEntry) {
                this.words.splice(potentialIndex, 1);
            } else { // deep search
                const index = this.words.indexOf(wordEntry);
                if (index == -1) return; // not found : (
                this.words.splice(index, 1);
            }

            onReady();
        }, 2000);
    }

    private indexValidIn(array: any[], index: number): boolean {
        return (0 <= index) && (index < array.length);
    }

    private initWords(languageIndexer: LanguageIndexer): WordEntry[] {
        const ger = languageIndexer.indexOf("German");
        const eng = languageIndexer.indexOf("English");
        return [
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
    }

    private initLanguageIndexer(): LanguageIndexer {
        const languages = [
            "English",
            "German"
        ];
        return new LanguageIndexer(languages);
    }
}
