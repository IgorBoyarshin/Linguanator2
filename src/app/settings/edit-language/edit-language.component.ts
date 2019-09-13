import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'edit-language',
    templateUrl: './edit-language.component.html',
    styleUrls: ['./edit-language.component.css']
})
export class EditLanguageComponent {
    public newName = ""; // [(ngModel)]
    @Input('languageName') public name: string;
    @Output() public doRename = new EventEmitter<string>();
    @Output() public cancelRename = new EventEmitter<void>();

    public rename() {
        this.doRename.emit(this.newName);
    }

    public cancel() {
        this.cancelRename.emit();
    }

    public display(): boolean {
        return this.name != null && this.name != undefined;
    }
}
