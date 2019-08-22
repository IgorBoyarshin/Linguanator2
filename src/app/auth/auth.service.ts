import { Observable, Subject, timer } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { User } from '../user.model';

import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private loginUrl = 'https://whateveryouwannacallit.tk/login';
    private reloginUrl = 'https://whateveryouwannacallit.tk/relogin';
    private loginNotificatorSubject = new Subject<void>();
    private logoutNotificatorSubject = new Subject<void>();

    private reloginSubject; // TODO: set type

    constructor(private http: HttpClient) {}

    login(username: string, password: string): any { // TODO: set type
        return this.http.post<any>(this.loginUrl, { username, password }).pipe(
            tap(_ => this.loginNotificatorSubject.next()),
            tap(res => this.setSession(res, username)),
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
        // Set relogin
        const tokenHalflifeMillis = 1000 * res.expiresIn / 2;
        this.reloginSubject = timer(tokenHalflifeMillis).subscribe(_ => this.relogin(username));

        const expiresAt = moment().add(res.expiresIn, 'second');

        localStorage.setItem(this.usernameTag, username);
        localStorage.setItem(this.idTokenTag, res.idToken);
        localStorage.setItem(this.expiresAtTag, JSON.stringify(expiresAt.valueOf()));
    }

    logout() {
        localStorage.removeItem(this.usernameTag);
        localStorage.removeItem(this.idTokenTag);
        localStorage.removeItem(this.expiresAtTag);

        this.reloginSubject.unsubscribe();
        this.logoutNotificatorSubject.next();
    }

    private tokenExpiration (): any { // TODO
        const item = localStorage.getItem(this.expiresAtTag);
        if (!item) return null;
        const expiresAt = JSON.parse(item);
        return moment(expiresAt);
    }

    tokenExpired(): boolean {
        const expiration = this.tokenExpiration();
        if (!expiration) return true;
        return moment().isAfter(this.tokenExpiration());
    }

    currentUsername(): string {
        return localStorage.getItem(this.usernameTag);
    }

    loginNotificator(): Subject<void> {
        return this.loginNotificatorSubject;
    }

    logoutNotificator(): Subject<void> {
        return this.logoutNotificatorSubject;
    }

    // TODO: use private members or not?
    get usernameTag(): string { return 'username'; }
    get idTokenTag(): string { return 'id_token'; }
    get expiresAtTag(): string { return 'expires_at'; }
}
