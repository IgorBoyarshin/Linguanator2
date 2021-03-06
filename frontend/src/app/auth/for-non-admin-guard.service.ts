import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from './auth.service';


@Injectable({
    providedIn: 'root'
})
export class ForNonAdminGuardService implements CanActivate {
    constructor(public authService: AuthService, public router: Router) {}

    public canActivate(): boolean {
        if (!this.authService.currentUserIsAdmin()) return true;

        this.router.navigateByUrl('/login');
        return false;
    }
}
