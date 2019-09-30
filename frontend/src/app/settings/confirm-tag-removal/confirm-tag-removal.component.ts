import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'confirm-tag-removal',
  templateUrl: './confirm-tag-removal.component.html',
  styleUrls: ['./confirm-tag-removal.component.css']
})
export class ConfirmTagRemovalComponent {
    @Input('tagName') public name: string;
    @Input() public totalWordsCount: number;
    @Output() public doRemove = new EventEmitter<void>();
    @Output() public cancelRemoval = new EventEmitter<void>();

    public remove() {
        this.doRemove.emit();
    }

    public cancel() {
        this.cancelRemoval.emit();
    }

    public display(): boolean {
        return this.name != null && this.name != undefined;
    }
}
