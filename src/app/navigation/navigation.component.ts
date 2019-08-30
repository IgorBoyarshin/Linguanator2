import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {
    constructor(private authService: AuthService) {}
    public ngOnInit() {}

    public currentUsername(): string {
        return this.authService.currentUsername();
    }

    public loggedIn(): boolean {
        return !this.authService.tokenExpired();
    }

    public logout() {
        this.authService.logout();
    }
}
