import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BsDropdownModule} from 'ngx-bootstrap/dropdown';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TestingComponent } from './testing/testing.component';
import { DatabaseComponent } from './database/database.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SettingsComponent } from './settings/settings.component';
import { NavigationComponent } from './navigation/navigation.component';
import { LoginComponent } from './login/login.component';
import { AuthInterceptor } from './auth/auth.interceptor';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditedWordEntryComponent } from './edited-word-entry/edited-word-entry.component';
import { YouStillThere } from './you-still-there/you-still-there.component';
import { ConfirmLanguageRemovalComponent } from './settings/confirm-language-removal/confirm-language-removal.component';
import { EditLanguageComponent } from './settings/edit-language/edit-language.component';

@NgModule({
    declarations: [
        AppComponent,
        TestingComponent,
        DatabaseComponent,
        NotFoundComponent,
        SettingsComponent,
        NavigationComponent,
        LoginComponent,
        EditedWordEntryComponent,
        YouStillThere,
        ConfirmLanguageRemovalComponent,
        EditLanguageComponent
    ],
    imports: [
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,
        BsDropdownModule.forRoot(),
        BrowserAnimationsModule
    ],
    providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true
    }],
    bootstrap: [AppComponent]
})
export class AppModule { }
