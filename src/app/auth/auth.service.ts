import { Subscription, Observable, Subject, timer } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as Tags from './local-storage-tags';

import * as moment from 'moment';


interface LoginResponse {
    idToken: string;
    expiresIn: number;
}


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private createAccountUrl = 'https://whateveryouwannacallit.tk/create';
    private loginUrl = 'https://whateveryouwannacallit.tk/login';
    private reloginUrl = 'https://whateveryouwannacallit.tk/relogin';
    private loginNotificatorSubject = new Subject<void>();

    private presenceTimer: Subscription;
    private youStillHereTimer: Subscription;
    private isAfk: boolean;
    private lastLogin: moment.Moment;

    constructor(private http: HttpClient) {}

    public createAccount(username: string, password: string): Observable<void> {
        return this.http.post<void>(this.createAccountUrl, { username, password }).pipe(
            shareReplay()
        );
    }

    public login(username: string, password: string): Observable<LoginResponse> {
        this.lastLogin = moment();
        return this.http.post<LoginResponse>(this.loginUrl, { username, password }).pipe(
            tap(res => this.setSession(res, username)),
            tap(_ => this.loginNotificatorSubject.next()),
            shareReplay()
        );
    }

    private relogin(username: string) {
        console.log('------ Relogging --------');
        this.lastLogin = moment();

        // Posting {} since the only data we need to send (token) is in the header
        this.http.post<LoginResponse>(this.reloginUrl, {}).pipe(
            tap(res => this.setSession(res, username)),
            shareReplay()
        ).subscribe();
    }

    private setSession({ idToken, expiresIn }: LoginResponse, username: string) {
        const expiresAt = moment().add(expiresIn, 'seconds');

        localStorage.setItem(Tags.USERNAME, username);
        localStorage.setItem(Tags.ID_TOKEN, idToken);
        localStorage.setItem(Tags.EXPIRES_AT, JSON.stringify(expiresAt.valueOf()));
    }

    public logout() {
        localStorage.removeItem(Tags.USERNAME);
        localStorage.removeItem(Tags.ID_TOKEN);
        localStorage.removeItem(Tags.EXPIRES_AT);

        window.location.reload();
    }

    private tokenExpiration(): moment.Moment {
        const item = localStorage.getItem(Tags.EXPIRES_AT);
        if (!item) return null;
        const expiresAt = JSON.parse(item);
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

    public resetPresenceTimer() {
        if (!this.tokenExpired()) { // if the user is logged in
            // Get a new JWT for this session
            const minReloginDelaySeconds = 60;
            const checkedRecently = moment().subtract(minReloginDelaySeconds, 'seconds').isBefore(this.lastLogin);
            if (!checkedRecently) {
                const username = localStorage.getItem(Tags.USERNAME);
                this.relogin(username);
            }

            // Reset presence timer
            if (this.presenceTimer) this.presenceTimer.unsubscribe();
            const presenceTimeoutMillis = 120 * 1000;
            this.presenceTimer = timer(presenceTimeoutMillis).subscribe(_ => this.logout());

            // Reset you-still-here timer
            if (this.youStillHereTimer) this.youStillHereTimer.unsubscribe();
            const youStillHereTimeoutMillis = 90 * 1000;
            this.youStillHereTimer = timer(youStillHereTimeoutMillis).subscribe(_ => this.isAfk = true);

            this.isAfk = false;
        }
    }

    public afkLongEnough(): boolean {
        return this.isAfk;
    }
}
