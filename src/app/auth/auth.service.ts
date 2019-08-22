import { Observable, Subject } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OnDestroy } from '@angular/core';

import { User } from '../user.model';

import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private loginUrl = 'https://whateveryouwannacallit.tk/login';
    private logoutNotificatorSubject = new Subject<void>();

    constructor(private http: HttpClient) {}

    ngOnDestroy() {
        // TODO
        // console.log('Destroying');
        // this.logout();
    }

    login(username: string, password: string): any { // TODO
        return this.http.post<any>(this.loginUrl, { username, password }).pipe(
            tap(res => this.setSession(res, username)),
            shareReplay()
        );
    }

    private setSession(res, username: string) {
        const expiresAt = moment().add(res.expiresIn, 'second');

        localStorage.setItem(this.usernameTag, username);
        localStorage.setItem(this.idTokenTag, res.idToken);
        localStorage.setItem(this.expiresAtTag, JSON.stringify(expiresAt.valueOf()));
    }

    logout() {
        localStorage.removeItem(this.usernameTag);
        localStorage.removeItem(this.idTokenTag);
        localStorage.removeItem(this.expiresAtTag);

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

    logoutNotificator(): Subject<void> {
        return this.logoutNotificatorSubject;
    }

    // TODO: use private members or not?
    get usernameTag(): string { return 'username'; }
    get idTokenTag(): string { return 'id_token'; }
    get expiresAtTag(): string { return 'expires_at'; }
}
