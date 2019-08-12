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
                    this.nextWordEntryIdToUse = 1 + this.maxIdUsed(this.words);
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

    private _addWordEntry({from, to, word, translations, score, tags}: WordEntry) {
        if (tags.length == 0) tags = ['main']; // TODO: find a better place to do this
        this.words.push(new WordEntry(this.nextWordEntryIdToUse, from, to, word, translations, score, tags));
        this.nextWordEntryIdToUse++;
    }

    addWordEntry(wordEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            this._addWordEntry(wordEntry);
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
        let nextId = 1;
        return [
            new WordEntry(nextId++, ger, eng, 'weit', ['wide', 'far', 'broad'], 2, ['tag1', 'tag2']),
            new WordEntry(nextId++, ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry(nextId++, ger, eng, 'gehorsam', ['obedient', 'submissive'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'regungslos', ['motionless', 'dead still'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'die Kerze', ['the candle'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'zu zweit', ['in pairs'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'der Fels', ['the rock', 'the cliff'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'kundtun', ['make known', 'proclaim'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'die Sünde', ['the sin'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'auswendig', ['by heart'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'anschauen', ['look at', 'watch', 'view'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'leuchten', ['light', 'shine', 'glow'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with somethings'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'zur selben Zeit', ['at the same time'], 1, ['main']),
            new WordEntry(nextId++, ger, eng, 'das Gedicht', ['the poem', 'the ode'], 1, ['main']),

            new WordEntry(nextId++, eng, ger, 'the boy', ['der Junge', 'der Knabe'], 3, ['main']),
        ];
    }

    private initLanguageIndexer(): LanguageIndexer {
        const languages = [
            new Language(1, "English"),
            new Language(2, "German"),
        ];
        return new LanguageIndexer(languages);
    }

    private maxIdUsed(words: WordEntry[]): number {
        if (words.length == 0) return -1;
        const ids = words.map(word => word.id);

        let maxId = ids[0];
        for (let id of ids) {
            if (id > maxId) maxId = id;
        }

        return maxId;
    }
}
