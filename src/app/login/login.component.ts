import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../auth/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    form: FormGroup;

    loggingIntoExisting = true;

    // TODO Check states everywhere
    usernameErrorDescription?: string;
    totalErrorDescription?: string;

    constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    submit() {
        const { username, password } = this.form.value;
        if (username && password) {
            // To give at least a small period of corectness to give a visual
            // feedback for switching from error to error
            this.usernameErrorDescription = null;
            this.totalErrorDescription = null;

            if (this.loggingIntoExisting) {
                this.authService.login(username, password).subscribe(() => {
                    console.log('Got logged in!');
                    this.router.navigateByUrl('/testing');
                }, err => {
                    switch (err.error.code) {
                        case 'ERR_INVALID_CREDENTIALS':
                            this.totalErrorDescription = 'Invalid username/password combination';
                            break;
                        case 'ERR_UNKNOWN': console.error('Something went wrong'); // TODO
                    }
                });
            } else {
                this.authService.createAccount(username, password).subscribe(() => {
                    console.log('Created new account!');
                    this.loggingIntoExisting = true;
                }, err => {
                    switch (err.error.code) {
                        case 'ERR_USERNAME_EXISTS':
                            this.usernameErrorDescription = 'This username already exists';
                            break;
                        case 'ERR_UNKNOWN': console.error('Something went wrong'); // TODO
                    }
                });
            }
        }
    }

    invalidUsername(): boolean {
        // TODO
        return Boolean(this.totalErrorDescription) || Boolean(this.usernameErrorDescription);
    }

    invalidPassword(): boolean {
        // TODO
        return Boolean(this.totalErrorDescription);
    }

    switchMethod() {
        this.loggingIntoExisting = !this.loggingIntoExisting;

        // clear
        this.usernameErrorDescription = null
        this.totalErrorDescription = null;
    }
}
