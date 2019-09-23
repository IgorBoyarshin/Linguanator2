import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'edit-tag',
  templateUrl: './edit-tag.component.html',
  styleUrls: ['./edit-tag.component.css']
})
export class EditTagComponent {
    public newName = ""; // [(ngModel)]
    @Input('tagName') public name: string;
    @Output() public doRename = new EventEmitter<string>();
    @Output() public cancelRename = new EventEmitter<void>();

    public rename() {
        this.doRename.emit(this.newName);
        this.newName = "";
    }

    public cancel() {
        this.cancelRename.emit();
        this.newName = "";
    }

    public display(): boolean {
        return this.name != null && this.name != undefined;
    }
}
