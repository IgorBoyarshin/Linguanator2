import { Input } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { Component } from '@angular/core';

import { LanguagePair } from '../language-pair.model';
import { EditedWordEntry } from '../word-entry.model';
import { AuthService } from '../auth/auth.service';

import { Observable } from 'rxjs';

@Component({
    selector: 'you-still-there',
    templateUrl: './you-still-there.component.html',
    styleUrls: ['./you-still-there.component.css']
})
export class YouStillThere {
    constructor(private authService: AuthService) {}

    public confirmPresence() {
        this.authService.confirmPresence();
    }

    public display(): boolean {
        return this.authService.afkLongEnough();
    }

    public logout(event) {
        this.authService.logout();

        event.stopPropagation();
        return false;
    }
}
