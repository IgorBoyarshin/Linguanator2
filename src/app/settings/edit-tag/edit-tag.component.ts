import { Component } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';
import { SettingsService } from '../../settings.service';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

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

    public newNameUnique = false;

    constructor(private settingsService: SettingsService) {}

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

    public renameButtonDisabled(): boolean {
        return (this.newName.length == 0) ||
              (this.newName == this.name) ||
              (!this.newNameUnique);
    }

    public checkIfUnique(currentName) {
        this.tagExists(currentName, this.name).subscribe(exists => this.newNameUnique = !exists);
    }

    private tagExists(name: string, excludedName: string): Observable<boolean> {
        return this.settingsService.allTags().pipe(map(tags =>
            tags.filter(tag => tag != excludedName).includes(name)));
    }
}
