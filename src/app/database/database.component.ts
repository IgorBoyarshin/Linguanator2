import { Component, OnInit } from '@angular/core';

import { WordEntry } from '../word-entry.model';
import { WordsDatabaseService } from '../words-database.service';

@Component({
    selector: 'app-database',
    templateUrl: './database.component.html',
    styleUrls: ['./database.component.css']
})
export class DatabaseComponent implements OnInit {
    words: WordEntry[];

    constructor(private wordsDatabaseService: WordsDatabaseService) {}

    ngOnInit() {
        this.words = this.wordsDatabaseService.gerToEng;
    }
}
