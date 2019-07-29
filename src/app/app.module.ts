import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BsDropdownModule} from 'ngx-bootstrap/dropdown';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestingComponent } from './testing/testing.component';
import { DatabaseComponent } from './database/database.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SettingsComponent } from './settings/settings.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { EditedWordEntryComponent } from './edited-word-entry/edited-word-entry.component';

@NgModule({
    declarations: [
        AppComponent,
        TestingComponent,
        DatabaseComponent,
        NotFoundComponent,
        SettingsComponent,
        NavigationComponent,
        EditedWordEntryComponent
    ],
    imports: [
        FormsModule,
        BrowserModule,
        AppRoutingModule,
        BsDropdownModule.forRoot(),
        BrowserAnimationsModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
