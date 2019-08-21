import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OnDestroy } from '@angular/core';

import { User } from './user.model';

import * as moment from 'moment';

@Injectable({
    providedIn: 'root'
})
export class AuthService implements OnDestroy {
    private loginUrl = 'https://whateveryouwannacallit.tk/login';

    constructor(private http: HttpClient) {}

    ngOnDestroy() {
        // TODO
        console.log('Destroying');
        this.logout();
    }

    login(username: string, password: string) {
        return this.http.post<any>(this.loginUrl, { username, password }).pipe(
            tap(res => this.setSession(res)),
            shareReplay()
        );
    }

    private setSession(res) {
        const expiresAt = moment().add(res.expiresIn, 'second');

        localStorage.setItem(this.idTokenName, res.idToken);
        localStorage.setItem(this.expiresAtName, JSON.stringify(expiresAt.valueOf()));
    }

    logout() {
        localStorage.removeItem(this.idTokenName);
        localStorage.removeItem(this.expiresAtName);
    }

    tokenExpiration () {
        const expiresAt = JSON.parse(localStorage.getItem(this.expiresAtName));
        return moment(expiresAt);
    }

    tokenExpired() {
        return moment().isAfter(this.tokenExpiration());
    }

    // TODO: use private members or not?
    get idTokenName(): string { return 'id_token'; }
    get expiresAtName(): string { return 'expires_at'; }
}
