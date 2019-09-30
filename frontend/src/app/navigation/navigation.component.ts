import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
    constructor(private authService: AuthService) {}

    public ngOnInit() {
        // This will make sure the essential varibales such as (isAdmin, timers etc)
        // survive page reload.
        // This place was chosen because it this component is always present and
        // its ngOnInit() is thus always triggered upon page reload finish.
        this.authService.confirmPresence();
    }

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
