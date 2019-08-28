import { Observable, Subject, timer } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import * as TAGS from './local-storage-tags';

import { User } from '../user.model';

import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private createAccountUrl = 'https://whateveryouwannacallit.tk/create';
    private loginUrl = 'https://whateveryouwannacallit.tk/login';
    private reloginUrl = 'https://whateveryouwannacallit.tk/relogin';
    private loginNotificatorSubject = new Subject<void>();

    private reloginSubject; // TODO: set type

    constructor(private http: HttpClient) {
        const reloginAtFormatted = localStorage.getItem(TAGS.reloginAt);
        if (reloginAtFormatted) {
            const reloginAt = moment(JSON.parse(reloginAtFormatted));
            const now = moment();
            const username = localStorage.getItem(TAGS.username);
            if (now.isAfter(reloginAt)) this.relogin(username);
            else {
                const countdownSeconds = reloginAt.diff(now, 'seconds');
                this.setReloginTimerIn(countdownSeconds, username);
            }
        }
    }

    public createAccount(username: string, password: string): any { // TODO: set type
        return this.http.post<any>(this.createAccountUrl, { username, password }).pipe(
            shareReplay()
        );
    }

    public login(username: string, password: string): any { // TODO: set type
        return this.http.post<any>(this.loginUrl, { username, password }).pipe(
            tap(res => this.setSession(res, username)),
            tap(_ => this.loginNotificatorSubject.next()),
            shareReplay()
        );
    }

    private relogin(username: string) {
        console.log('------ Relogging --------');
        this.reloginSubject.unsubscribe(); // finish previous
        // TODO: posting {} since the only data we need to send (token) is in the header
        this.http.post<any>(this.reloginUrl, {}).pipe(
            tap(res => this.setSession(res, username)),
            shareReplay()
        ).subscribe();
    }

    private setSession(res, username: string) {
        const tokenHalflifeSeconds = res.expiresIn / 2;
        this.setReloginTimerIn(tokenHalflifeSeconds, username);
        const expiresAt = moment().add(res.expiresIn, 'seconds');
        const reloginAt = moment().add(tokenHalflifeSeconds, 'seconds');

        localStorage.setItem(TAGS.username, username);
        localStorage.setItem(TAGS.idToken, res.idToken);
        localStorage.setItem(TAGS.expiresAt, JSON.stringify(expiresAt.valueOf()));
        localStorage.setItem(TAGS.reloginAt, JSON.stringify(reloginAt.valueOf()));
    }

    private setReloginTimerIn(halflifeSeconds: number, username: string) {
        this.reloginSubject = timer(1000 * halflifeSeconds).subscribe(_ => this.relogin(username));
    }

    public logout() {
        localStorage.removeItem(TAGS.username);
        localStorage.removeItem(TAGS.idToken);
        localStorage.removeItem(TAGS.expiresAt);
        localStorage.removeItem(TAGS.reloginAt);

        this.reloginSubject.unsubscribe();
    }

    private tokenExpiration (): any { // TODO
        const item = localStorage.getItem(TAGS.expiresAt);
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
        return localStorage.getItem(TAGS.username);
    }

    public loginNotificator(): Subject<void> {
        return this.loginNotificatorSubject;
    }
}
