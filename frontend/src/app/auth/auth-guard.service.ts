import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class AuthGuardService implements CanActivate {
    constructor(public auth: AuthService, public router: Router) {}

    public canActivate(): boolean {
        if (this.auth.loggedIn()) return true;

        this.router.navigateByUrl('/login');
        return false;
    }
}
