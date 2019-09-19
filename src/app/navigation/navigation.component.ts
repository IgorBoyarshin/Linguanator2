import { Component } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css']
})
export class NavigationComponent {
    constructor(private authService: AuthService) {}

    public currentUsername(): string {
        return this.authService.currentUsername();
    }

    public loggedIn(): boolean {
        return this.authService.loggedIn();
    }

    public logout() {
        this.authService.logout();
    }

    public userIsAdmin() {
        return this.authService.currentUserIsAdmin();
    }
}
