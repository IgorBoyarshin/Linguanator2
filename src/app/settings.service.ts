import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { Injectable } from '@angular/core';

import { AuthService } from './auth/auth.service';
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
    private currentLanguagePairObservable: Observable<LanguagePair>;
    private tags: string[];
    private currentTags: string[];

    constructor(
        private authService: AuthService,
        private dataProviderFactory: DataProviderFactoryService
    ) {}

    public resetLanguagePairCache() {
        this.currentLanguagePairObservable = null;
    }

    public resetTagsCache() {
        this.tags = null;
        this.currentTags = null;
    }

    public toggleAllTags(): Observable<void> {
        return Observable.create(subscriber => {
            const allChecked = this.currentTags.length == this.tags.length; // (hack)
            if (allChecked) this.currentTags = [];
            else            this.currentTags = [...this.tags];

            subscriber.next();
        });
    }

    public setTagState(tag: string, checked: boolean): Observable<void> {
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

    public allStatefulTags(): Observable<StatefulTag[]> {
        return combineLatest(this.allTags(), this.tagsInUse())
            .pipe(map(([allTags, tagsInUse]) => allTags.map(tag => {
                    const checked = tagsInUse.includes(tag);
                    return {tag, checked};
                })
            ));
    }

    public allTags(): Observable<string[]> {
        if (!this.tags) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveEntries().subscribe(entries => {
                    this.tags = [...new Set( // To leave unique tags
                        entries.flatMap(word => word.tags)
                    )];
                    subscriber.next(this.tags);
                });
            });
        }
        return of(this.tags);
    }

    private tagsInUse(): Observable<string[]> {
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

    public languagePairInUse(): Observable<LanguagePair | null> {
        if (!this.currentLanguagePairObservable) {
            this.currentLanguagePairObservable = this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer().pipe(
                map(selfLanguagesIndexer => {
                    const [id1, id2] = selfLanguagesIndexer.allIds();
                    if (!id2) return null; // less than 2 languages available
                    return new LanguagePair(id1, id2);
                })
            );
        }
        return this.currentLanguagePairObservable;
    }

    public insufficientLanguages(): Observable<boolean> {
        return this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer()
            .pipe(map(indexer => indexer.allLanguages().length < 2));
    }

    public changeSrcLanguageTo(language: string): Observable<void> {
        return this.changeLanguageTo(true, language);
    }

    public changeDstLanguageTo(language: string): Observable<void> {
        return this.changeLanguageTo(false, language);
    }

    private changeLanguageTo(changeSrc: boolean, language: string): Observable<void> {
        return combineLatest(
            this.dataProviderFactory.dataProviderInUse().retrieveSelfLanguagesIndexer(),
            this.languagePairInUse()
        ).pipe(
            map(([selfLanguagesIndexer, currentLanguagePair]) => {
                if (!currentLanguagePair) return null;
                const newIndex = selfLanguagesIndexer.idOf(language);
                const theOtherIndex = changeSrc ? currentLanguagePair.dst
                                                : currentLanguagePair.src;
                if (newIndex == theOtherIndex) { // then just flip
                    const { src, dst } = currentLanguagePair;
                    return new LanguagePair(dst, src);
                } else {
                    return changeSrc   ? new LanguagePair(newIndex, theOtherIndex)
                        /* changeDst */: new LanguagePair(theOtherIndex, newIndex);
                }
            }),
            tap(languagePair => this.currentLanguagePairObservable = of(languagePair)),
            map(_ => void(0))
        );
    }
}
