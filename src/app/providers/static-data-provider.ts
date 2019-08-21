import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { Language } from '../language-model';
import { LanguageIndexer } from '../language-indexer';

export class StaticDataProvider implements DataProvider {
    private nextWordEntryIdToUse: number = 1;
    private entries: WordEntry[];
    private languageIndexer: LanguageIndexer;

    constructor() {}

    retrieveEntries(): Observable<WordEntry[]> {
        // TODO: Potentially creates multiple Observables, each one sent to query
        // the result and rewrite this.entries upon arrival
        if (!this.entries) {
            return Observable.create(subscriber => {
                this.retrieveLanguageIndexer().subscribe(languageIndexer => {
                    this.entries = this.initEntries(languageIndexer);
                    this.nextWordEntryIdToUse = 1 + this.maxIdUsed(this.entries);
                    subscriber.next(this.entries);
                });
            });
        }
        return of(this.entries);
    }

    retrieveLanguageIndexer(): Observable<LanguageIndexer> {
        if (!this.languageIndexer) {
            this.languageIndexer = this.initLanguageIndexer();
        }
        return of(this.languageIndexer);
    }

    addWordEntry({from, to, word, translations, score, tags}: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            const DEFAULT_TAGS = ['main'];
            if (tags.length == 0) tags = DEFAULT_TAGS;
            // const currentUserId = this.authService.current
            const currentUserId = 1; // TODO
            this.entries.push(new WordEntry(currentUserId, this.nextWordEntryIdToUse, from, to, word, translations, score, tags));
            this.nextWordEntryIdToUse++;
            subscriber.next();
        });
    }

    updateWordEntry(id: number, newEntry: WordEntry): Observable<void> {
        return Observable.create(subscriber => {
            const index = this.indexOfEntryWithId(id, this.entries);
            if (index == -1) return; // not found : (
            this.entries[index] = newEntry;

            subscriber.next();
        });
    }

    removeWordEntry(id: number): Observable<void> {
        return Observable.create(subscriber => {
            const index = this.indexOfEntryWithId(id, this.entries);
            if (index == -1) return; // not found : (
            this.entries.splice(index, 1);

            subscriber.next();
        });
    }

    private indexOfEntryWithId(id: number, entries: WordEntry[]): number {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].id === id) return i;
        }
        console.error("[indexOfEntryWithId()]: not found for id=", id);
        return -1;
    }

    private initEntries(languageIndexer: LanguageIndexer): WordEntry[] {
        const ger = languageIndexer.indexOf("German");
        const eng = languageIndexer.indexOf("English");
        const userId = 1;
        let nextId = 1;
        return [
            new WordEntry(userId, nextId++, ger, eng, 'weit', ['wide', 'far', 'broad'], 2, ['tag1', 'tag2']),
            new WordEntry(userId, nextId++, ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 0, ['tag1']),
            new WordEntry(userId, nextId++, ger, eng, 'gehorsam', ['obedient', 'submissive'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'regungslos', ['motionless', 'dead still'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'die Kerze', ['the candle'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'zu zweit', ['in pairs'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'der Fels', ['the rock', 'the cliff'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'kundtun', ['make known', 'proclaim'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'die Sünde', ['the sin'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'auswendig', ['by heart'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'anschauen', ['look at', 'watch', 'view'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'leuchten', ['light', 'shine', 'glow'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with something'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'zur selben Zeit', ['at the same time'], 1, ['main']),
            new WordEntry(userId, nextId++, ger, eng, 'das Gedicht', ['the poem', 'the ode'], 1, ['main']),

            new WordEntry(userId, nextId++, eng, ger, 'the boy', ['der Junge', 'der Knabe'], 3, ['main']),
        ];
    }

    private initLanguageIndexer(): LanguageIndexer {
        const languages = [
            new Language(1, "English"),
            new Language(2, "German"),
        ];
        return new LanguageIndexer(languages);
    }

    private maxIdUsed(entries: WordEntry[]): number {
        if (entries.length == 0) return -1;
        const ids = entries.map(word => word.id);

        let maxId = ids[0];
    }
}
