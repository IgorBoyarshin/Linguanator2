import { Subscription, Observable, of, Subject, timer } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as Tags from './local-storage-tags';

import * as moment from 'moment';


// TODO: rename. Remove duplicate in HttpProvider
interface TokenEntry {
    idToken: string;
    expiresAt: string;
}


interface Response<T> {
    tokenEntry: TokenEntry;
    data: T;
}



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
    private lastLogin: moment.Moment;

    constructor(private http: HttpClient) {}

    public createAccount(username: string, password: string): Observable<void> {
        return this.http.post<Response<any>>(this.createAccountUrl, { username, password }).pipe(
            map(_ => void(0)),
            shareReplay()
        );
    }

    public login(username: string, password: string): Observable<void> {
        this.lastLogin = moment();
        // (otherwise the variable will be null inside resetPresenceTimer())
        return this.http.post<Response<any>>(this.loginUrl, { username, password }).pipe(
            tap(({ tokenEntry }) => this.setSession(tokenEntry, username)),
            tap(_ => this.loginNotificatorSubject.next()),
            map(_ => void(0)), // do not leak the data
            shareReplay()
        );
    }

    // TODO: check naming
    public updateSession({ idToken, expiresAt }: TokenEntry) {
        // const expiresAt = moment().add(expiresIn).format();
        localStorage.setItem(Tags.ID_TOKEN, idToken);
        localStorage.setItem(Tags.EXPIRES_AT, expiresAt);
    }

    public doRelogin() {
        const minReloginDelaySeconds = 10;
        if (!this.lastLogin) {
            // This function is supposed to be called after the first login()
            // has beed executed, so lastLogin is already set.
            // This function is called either for rerouting, which is subscribed to login(),
            // or confirming presense, which is long after the login().
            console.error('ASSERTION FAILED: lastLogin is undefined');
        }
        const reloggedRecently = this.lastLogin.isAfter(moment().subtract(minReloginDelaySeconds, 'seconds'));
        if (!reloggedRecently) {
            const username = localStorage.getItem(Tags.USERNAME);
            this.relogin(username);
        }
    }

    private relogin(username: string) {
        console.log('------ Relogging --------');
        this.lastLogin = moment();

        // Posting {} since the only data we need to send (token) is in the header
        this.http.post<Response<any>>(this.reloginUrl, {})
            .subscribe(({ tokenEntry }) => this.setSession(tokenEntry, username));
    }

    // TODO: merge with updateSession???
    private setSession({ idToken, expiresAt }: TokenEntry, username: string) {
        // const expiresAt = moment().add(expiresIn).format();
        localStorage.setItem(Tags.USERNAME, username);
        localStorage.setItem(Tags.ID_TOKEN, idToken);
        localStorage.setItem(Tags.EXPIRES_AT, expiresAt);
    }

    public logout() {
        console.log('------ Log out --------');
        this.loggingOut = true;
        // Posting {} since the only data we need to send (token) is in the header
        this.http.post<any>(this.logoutUrl, {}).subscribe(_ => {
            // We need this data in the Interceptor of this request (the one we're in),
            // so remove the items only after the backend has received the request
            localStorage.removeItem(Tags.USERNAME);
            localStorage.removeItem(Tags.ID_TOKEN);
            localStorage.removeItem(Tags.EXPIRES_AT);
            window.location.reload();
        });
    }

    public isLoggingOut(): boolean {
        return this.loggingOut;
    }

    private tokenExpiration(): moment.Moment {
        const expiresAt = localStorage.getItem(Tags.EXPIRES_AT);
        if (!expiresAt) return null;
        return moment(expiresAt);
    }

    public tokenExpired(): boolean {
        const expiration = this.tokenExpiration();
        if (!expiration) return true;
        return moment().isAfter(this.tokenExpiration());
    }

    public currentUsername(): string {
        return localStorage.getItem(Tags.USERNAME);
    }

    public loginNotificator(): Subject<void> {
        return this.loginNotificatorSubject;
    }

    // Because this method is called in the Interceptor, upon page reload there
    // are bound to be http connections to the backend, thus the Interceptor is
    // triggered and thus this method is fired. That is how the timers survive
    // page reload.
    public resetPresenceTimer() {
        if (!this.tokenExpired()) { // if the user is logged in
            // Reset presence timer
            if (this.presenceTimer) this.presenceTimer.unsubscribe();
            const presenceTimeoutMillis = 20 * 1000;
            this.presenceTimer = timer(presenceTimeoutMillis).subscribe(_ => this.logout());

            // Reset you-still-here timer
            if (this.youStillHereTimer) this.youStillHereTimer.unsubscribe();
            const youStillHereTimeoutMillis = 15 * 1000;
            this.youStillHereTimer = timer(youStillHereTimeoutMillis).subscribe(_ => {
                this.isAfk = true;
            });

            this.isAfk = false;
        }
    }

    public afkLongEnough(): boolean {
        return this.isAfk;
    }
}
