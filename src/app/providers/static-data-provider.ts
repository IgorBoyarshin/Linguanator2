import { Observable } from 'rxjs';
import { of } from 'rxjs';

import { DataProvider } from './data-provider';
import { WordEntry } from '../word-entry.model';
import { Language } from '../language-model';
import { LanguagePair } from '../language-pair.model';
import { LanguageIndexer } from '../language-indexer';
import { StatisticsUser } from '../statistics-user.model';
import { StatisticsLanguage } from '../statistics-language.model';

import * as Tags from '../auth/local-storage-tags';


class User {
    constructor(public id: number, public username, public password) {}
}

class UserWithEntries {
    constructor(public id: number, public username, public password, public wordEntries: WordEntry[]) {}
}


export class StaticDataProvider implements DataProvider {
    private nextWordEntryIdToUse: number;
    private entries: WordEntry[];
    private selfLanguagesIndexer: LanguageIndexer;

    private users: UserWithEntries[];

    public retrieveEntries(): Observable<WordEntry[]> {
        if (!this.entries) {
            return Observable.create(subscriber => {
                this.retrieveSelfLanguagesIndexer().subscribe(selfLanguagesIndexer => {
                    const allEntries = this.initEntries(selfLanguagesIndexer);
                    this.nextWordEntryIdToUse = this.nextAvailableId(allEntries);
                    this.users = this.wordEntriesIntoUsers(allEntries);
                    const targetUsername = this.currentUser();
                    const { id } = this.users.find(({ username }) => username === targetUsername);
                    this.entries = this.wordEntriesForUserId(id)
                    subscriber.next(this.entries);
                });
            });
        }
        return of(this.entries);
    }

    public retrieveSelfLanguagesIndexer(): Observable<LanguageIndexer> {
        if (!this.selfLanguagesIndexer) {
            this.selfLanguagesIndexer = this.initLanguageIndexer();
        }
        return of(this.selfLanguagesIndexer);
    }

    public addWordEntry({ src, dst }: LanguagePair,
                        word: string,
                        translations: string[],
                        tags: string[]): Observable<void> {
        return Observable.create(subscriber => {
            const DEFAULT_TAGS = ['main'];
            if (tags.length == 0) tags = DEFAULT_TAGS;

            const targetUsername = this.currentUser();
            const { id } = this.users.find(({ username }) => username === targetUsername);

            const score = 0;
            this.entries.push(new WordEntry(id, this.nextWordEntryIdToUse,
                                src, dst, word, translations, score, tags));
            this.nextWordEntryIdToUse++;
            subscriber.next();
        });
    }

    public updateWordEntry(id: number,
                           { src, dst }: LanguagePair,
                           word: string,
                           translations: string[],
                           score: number,
                           tags: string[]): Observable<void> {
        return Observable.create(subscriber => {
            const index = this.indexOfEntryWithId(id, this.entries);
            if (index != -1) {
                const ref = this.entries[index];
                ref.id = id;
                ref.from = src;
                ref.to = dst;
                ref.word = word;
                ref.translations = translations;
                ref.score = score;
                ref.tags = tags;
            }
            subscriber.next();
        });
    }

    public removeWordEntry(id: number): Observable<void> {
        return Observable.create(subscriber => {
            const index = this.indexOfEntryWithId(id, this.entries);
            if (index != -1) this.entries.splice(index, 1);
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

    private initEntries(selfLanguagesIndexer: LanguageIndexer): WordEntry[] {
        const ger = selfLanguagesIndexer.idOf("German");
        const eng = selfLanguagesIndexer.idOf("English");
        const userId1 = 1;
        const userId2 = 2;
        let id = 1;
        return [
            new WordEntry(userId1, id++, ger, eng, 'weit', ['wide', 'far', 'broad'], 3, ['tag1', 'tag2']),
            new WordEntry(userId1, id++, ger, eng, 'aufmerksam', ['attentive', 'mindful', 'thoughtful'], 1, ['tag1']),
            new WordEntry(userId1, id++, ger, eng, 'gehorsam', ['obedient', 'submissive'], 2, ['tag2']),
            new WordEntry(userId1, id++, ger, eng, 'die Einsamkeit', ['the loneliness', 'the solitude'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'regungslos', ['motionless', 'dead still'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'die Kerze', ['the candle'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'zu zweit', ['in pairs'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'der Fels', ['the rock', 'the cliff'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'kundtun', ['make known', 'proclaim'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'das Verlangen', ['the demand', 'the desire', 'the request'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'verderben', ['spoil', 'ruin', 'corrupt'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'wesentlich', ['significant', 'essential', 'crucial', 'fundamental'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'die Sünde', ['the sin'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'auswendig', ['by heart'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'der Schatz', ['the treasure', 'the sweetheart', 'the honey'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'anschauen', ['look at', 'watch', 'view'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'unbeteiligt', ['unconcerned', 'uninvolved', 'indifferent'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'beweisen', ['prove', 'demonstrate', 'show'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'leuchten', ['light', 'shine', 'glow'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'allerdings', ['however', 'certainly', 'admittedly', 'though'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'sich mit etwas begnügen', ['content oneself with something', 'make do with something'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'ungefähr', ['approximate', 'rough', 'nearly'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'bestätigen', ['confirm', 'acknowledge', 'verify'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'die Verachtung', ['the disdain', 'the disgust'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'zur selben Zeit', ['at the same time'], 2, ['main']),
            new WordEntry(userId1, id++, ger, eng, 'das Gedicht', ['the poem', 'the ode'], 2, ['main']),

            new WordEntry(userId1, id++, eng, ger, 'the boy', ['der Junge', 'der Knabe'], 4, ['main']),

            new WordEntry(userId2, id++, ger, eng, 'der Vogel', ['the bird'], 3, ['joetag']),
            new WordEntry(userId2, id++, eng, ger, 'the cow', ['die Kuh'], 4, ['joetag']),
            new WordEntry(userId2, id++, eng, ger, 'the horse', ['das Pferd'], 5, ['main'])
        ];
    }

    private initLanguageIndexer(): LanguageIndexer {
        const languages = [
            new Language(1, "English"),
            new Language(2, "German"),
        ];
        return new LanguageIndexer(languages);
    }

    private nextAvailableId(entries: WordEntry[]): number {
        if (entries.length == 0) return 1;
        const ids = entries.map(entry => entry.id);

        let maxId = ids[0];
        for (let id of ids) {
            if (id > maxId) maxId = id;
        }

        return maxId + 1;
    }

    private currentUser(): string {
        return localStorage.getItem(Tags.USERNAME)
    }

    private wordEntriesIntoUsers(wordEntries: WordEntry[]): UserWithEntries[] {
        let usersWithEntries = [];
        const users = this.initUsers();
        for (let { id, username, password } of users) {
            usersWithEntries.push(new UserWithEntries(id, username, password, []));
        }

        for (let wordEntry of wordEntries) {
            const userId = wordEntry.userId;
            const { wordEntries } = usersWithEntries.find(({ id }) => id == userId);
            wordEntries.push(wordEntry);
        }

        return usersWithEntries;
    }

    private wordEntriesForUserId(userId: number): WordEntry[] {
        return this.users.find(({ id }) => id == userId).wordEntries;
    }

    private initUsers(): User[] {
        return [
            new User(1, 'Igorek', 'igorekpass'),
            new User(2, 'Joe', 'joepass')
        ];
    }

    public renameTag(oldName: string, newName: string): Observable<void> {
        // TODO
        return of();
    }

    public addSelfLanguage(name: string): Observable<void> {
        // TODO
        return of();
    }

    public removeSelfLanguage(id: number): Observable<void> {
        // TODO
        return of();
    }

    public retrieveAllLanguagesIndexer(): Observable<LanguageIndexer> {
        // TODO
        return of();
    }

    // For Admin
    public retrieveStatisticsUsers(): Observable<StatisticsUser[]> {
        // TODO
        return of();
    }

    public retrieveStatisticsLanguages(): Observable<StatisticsLanguage[]> {
        // TODO
        return of();
    }

    public addAllLanguage(name: string): Observable<void> {
        // TODO
        return of();
    }

    public removeAllLanguage(id: number): Observable<void> {
        // TODO
        return of();
    }
}
