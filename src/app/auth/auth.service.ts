import { Subscription, Observable, of, Subject, timer } from 'rxjs';
import { map, tap, shareReplay, finalize } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenEntry, Response } from '../http-response.model';

import * as Tags from './local-storage-tags';
import * as moment from 'moment';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private createAccountUrl = 'https://whateveryouwannacallit.tk/create';
    private loginUrl = 'https://whateveryouwannacallit.tk/login';
    private logoutUrl = 'https://whateveryouwannacallit.tk/logout';
    private reloginUrl = 'https://whateveryouwannacallit.tk/relogin';
    private loginNotificatorSubject = new Subject<void>();

    private presenceTimer: Subscription;
    private youStillHereTimer: Subscription;
    private isAfk = false;
    private loggingOut = false;
    private lastJwtRefresh: moment.Moment;

    private isAdmin: boolean;

    constructor(private http: HttpClient) {}

    public createAccount(username: string, password: string): Observable<void> {
        return this.http.post<Response<any>>(this.createAccountUrl, { username, password }).pipe(
            map(_ => void(0)),
            shareReplay()
        );
    }

    public login(username: string, password: string): Observable<void> {
        return this.http.post<Response<{ isAdmin: boolean }>>(this.loginUrl, { username, password }).pipe(
            tap(({ tokenEntry, isAdmin }) => this.setSession(tokenEntry, username, isAdmin)),
            tap(_ => this.loginNotificatorSubject.next()),
            map(_ => void(0)), // do not leak the data
            shareReplay()
        );
    }

    public refreshedJwt() {
        this.lastJwtRefresh = moment();
    }

    private setSession(tokenEntry: TokenEntry, username: string, isAdmin: boolean) {
        this.updateSession(tokenEntry, isAdmin)
        localStorage.setItem(Tags.USERNAME, username);
    }

    public updateSession({ idToken, expiresAt }: TokenEntry, isAdmin: boolean) {
        this.isAdmin = isAdmin;
        localStorage.setItem(Tags.ID_TOKEN, idToken);
        localStorage.setItem(Tags.EXPIRES_AT, expiresAt);
    }

    public logout() {
        console.log('------ Log out --------');
        this.loggingOut = true;
        // Posting {} since the only data we need to send (token) is in the header
        this.http.post<any>(this.logoutUrl, {}).pipe(finalize(() => {
            // We need this data in the Interceptor of this request (the one we're in),
            // so remove the items only after the backend has received the request
            localStorage.removeItem(Tags.USERNAME);
            localStorage.removeItem(Tags.ID_TOKEN);
            localStorage.removeItem(Tags.EXPIRES_AT);
            window.location.reload();
        })).subscribe();
    }

    // Presence is confirmed either by a backend request or a routing navigation
    // or pressing YES in the you-still-there box.
    // Because this method is called in the Interceptor, upon page reload there
    // are bound to be http connections to the backend, thus the Interceptor is
    // triggered and thus this method is fired. That is how the timers survive
    // page reload.
    // This method is also called in ngOnInit() of Navigator (so on page reload finish).
    // The latter is done to make sure isAdmin and possibly other variables survive page reload.
    public confirmPresence() {
        if (!this.loggedIn()) return;

        // XXX: (maxJwtRefreshDelaySeconds + presenceTimeoutMillis) MUST NOT exceed
        // JWT's lifespan. This sum is the maximum possible timespan without a
        // JWT renewal (achieved by resetting the timers just before
        // the end of maxJwtRefreshDelaySeconds timeframe).
        const maxJwtRefreshDelaySeconds = 45;
        // lastJwtRefresh is set through refreshedJwt() inside the interceptor
        // just before this method (confirmPresence) is called.
        const refreshedJwtRecently = this.lastJwtRefresh && this.lastJwtRefresh.isAfter(
            moment().subtract(maxJwtRefreshDelaySeconds, 'seconds'));
        if (!refreshedJwtRecently) {
            // Posting {} since the only data we need to send (token) is in the header
            this.http.post<Response<any>>(this.reloginUrl, {})
                .subscribe(({ tokenEntry, isAdmin }) => this.updateSession(tokenEntry, isAdmin));
        }

        // Reset presence timer
        if (this.presenceTimer) this.presenceTimer.unsubscribe();
        const presenceTimeoutMillis = 3 * 120 * 1000;
        this.presenceTimer = timer(presenceTimeoutMillis).subscribe(_ => this.logout());

        // Reset you-still-here timer
        if (this.youStillHereTimer) this.youStillHereTimer.unsubscribe();
        const youStillHereTimeoutMillis = 3 * 90 * 1000;
        this.youStillHereTimer = timer(youStillHereTimeoutMillis).subscribe(_ => this.isAfk = true);
        this.isAfk = false;
    }

    public afkLongEnough(): boolean {
        return this.isAfk;
    }

    public loggedIn(): boolean {
        if (this.loggingOut) return false;
        const expiresAt = localStorage.getItem(Tags.EXPIRES_AT);
        if (!expiresAt) return false;
        return moment().isBefore(moment(expiresAt));
    }

    public currentUsername(): string {
        return localStorage.getItem(Tags.USERNAME);
    }

    public loginNotificator(): Subject<void> {
        return this.loginNotificatorSubject;
    }

    public currentUserIsAdmin(): boolean {
        return this.isAdmin;
    }
}
