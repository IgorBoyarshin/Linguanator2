import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
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
    private languageIndexer: LanguageIndexer;
    private currentLanguagePair: LanguagePair;

    private tags: string[];
    private currentTags: string[];

    constructor(
        private authService: AuthService,
        private dataProviderFactory: DataProviderFactoryService
    ) {
        this.authService.loginNotificator().subscribe(() =>
            this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer()
                .subscribe(languageIndexer => {
                    this.languageIndexer = languageIndexer;
                    this.currentLanguagePair = new LanguagePair(
                        languageIndexer.indexOf("German"),
                        languageIndexer.indexOf("English")
                    );
                })
        );
    }

    resetTagsCache() {
        this.tags = null;
        this.currentTags = null;
    }

    toggleAllTags(): Observable<void> {
        return Observable.create(subscriber => {
            const allChecked = this.currentTags.length == this.tags.length; // XXX: hack
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
        return combineLatest(this.allTags(), this.tagsInUse())
            .pipe(map(([allTags, tagsInUse]) => allTags.map(tag => {
                    const checked = tagsInUse.includes(tag);
                    return {tag, checked};
                })
            ));
    }

    allTags(): Observable<string[]> {
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

    languagePairInUse(): Observable<LanguagePair> {
        if (!this.currentLanguagePair) {
            return Observable.create(subscriber => {
                this.dataProviderFactory.dataProviderInUse().retrieveLanguageIndexer().subscribe(languageIndexer => {
                    this.languageIndexer = languageIndexer;
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

    // It makes little sense to make the changeLanguageTo functions family
    // to return an Observable (which we need because we depend on languageIndexer
    // in order to perform the change). The way we manage to pull off the lack
    // of return is by retrieving LanguageIndexer early (upon user login) and
    // then we HOPE that by the time the user changes the language the languageIndexer
    // is already resolved and ready (this is probable since these methods are triggered
    // by user and not by application init logic, so we take advantage of the
    // user's slow interaction with our application).
    changeSrcLanguageTo(language: string) {
        this.changeLanguageTo(true, language);
    }

    changeDstLanguageTo(language: string) {
        this.changeLanguageTo(false, language);
    }

    private changeLanguageTo(changeSrc: boolean, language: string) {
        if (!this.languageIndexer || !this.currentLanguagePair) {
            console.error('===== ASSERTION FAILED =======');
            return;
        }

        const newIndex = this.languageIndexer.indexOf(language);
        const theOtherIndex = changeSrc ? this.currentLanguagePair.dst
                                        : this.currentLanguagePair.src;
        if (newIndex == theOtherIndex) { // then just flip
            const {src, dst} = this.currentLanguagePair;
            this.currentLanguagePair = new LanguagePair(dst, src);
        } else {
            this.currentLanguagePair =
                changeSrc   ? new LanguagePair(newIndex, theOtherIndex)
             /* changeDst */: new LanguagePair(theOtherIndex, newIndex);
        }
    }
}
