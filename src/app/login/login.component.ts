import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    form: FormGroup;

    constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    login() {
        const {username, password} = this.form.value;
        if (username && password) {
            this.authService.login(username, password).subscribe(() => {
                console.log('Got logged in!');
                this.router.navigateByUrl('/testing');
            });
        }
    }
}
