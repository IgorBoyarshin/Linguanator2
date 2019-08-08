import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { Injectable } from '@angular/core';

import { DataProviderFactoryService } from './providers/data-provider-factory.service';
import { LanguagePair } from './language-pair.model';
import { LanguageIndexer } from './language-indexer';

export class StatefulTag {
    constructor(public tag: string, public checked: boolean) {}
}

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private currentLanguagePair: LanguagePair;

    private tags: string[];
    private currentTags: string[];

    constructor(private dataProviderFactory: DataProviderFactoryService) {}

    toggleAllTags(): Observable<void> {
        return Observable.create(subscriber => {
            const allChecked = this.currentTags.length == this.tags.length; // XXX: hope it works
            if (allChecked) this.currentTags = [];
            else            this.currentTags = [...this.tags];

            subscriber.next();
        });
    }

    setTagState(tag: string, checked: boolean): Observable<void> {
        return Observable.create(subscriber => {
            this._setTagState(tag, checked);
            subscriber.next();
        });
    }

    private _setTagState(tag: string, checked: boolean) {
        if (checked && !this.currentTags.includes(tag)) { // include
            this.currentTags.push(tag);
        } else if (!checked && this.currentTags.includes(tag)) { // remove
            const index = this.currentTags.indexOf(tag);
            this.currentTags.splice(index, 1);
        }
    }

    allStatefulTags(): Observable<StatefulTag[]> {
        return combineLatest(this.allTags(), this.tagsInUse()).pipe(map(([allTags, tagsInUse]) => {
            // TODO: Could make a one-liner
            return allTags.map(tag => {
                const checked = tagsInUse.includes(tag);
                return {tag, checked};
            });
        }));
    }

    allTags(): Observable<string[]> {
        if (!this.tags) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveWords().subscribe(words => {
                    this.tags = [...new Set( // To leave unique tags
                        words.flatMap(word => word.tags)
                    )];
                    subscriber.next(this.tags);
                });
            });
        }
        return of(this.tags);
    }

    // TODO: used??????
    tagsInUse(): Observable<string[]> {
        if (!this.currentTags) {
            return Observable.create(subscriber => {
                this.allTags().subscribe(tags => {
                    this.currentTags = [...tags];
                    subscriber.next(this.currentTags);
                });
            });
        }
        return of(this.currentTags);
    }

    languagePairInUse(): Observable<LanguagePair> {
        if (!this.currentLanguagePair) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
                    this.currentLanguagePair = new LanguagePair(
                        languageIndexer.indexOf("German"),
                        languageIndexer.indexOf("English")
                    );
                    subscriber.next(this.currentLanguagePair);
                });
            });
        }
        return of(this.currentLanguagePair);
    }

    flipLanguagePairInUse() {
        if (!this.currentLanguagePair)
            console.error('[SettingsService:flipLanguagePairInUse()]: called without existing currentLanguagePair');
        const {src, dst} = this.currentLanguagePair;
        this.currentLanguagePair = new LanguagePair(dst, src);
    }

    setLanguagePairTo(languagePair: LanguagePair) {
        this.currentLanguagePair = languagePair;
    }
}
