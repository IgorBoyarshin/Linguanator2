import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from "@angular/router";
import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';
import * as Tags from './local-storage-tags';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService, private router: Router) {
        router.events.pipe(filter(e => e instanceof NavigationEnd))
            .subscribe(_ => this.authService.confirmPresence());
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // The idea is to set it once before the event so that all subsequent relogins
        // are discarded as unnesessary, since one relogin request is on its way already.
        // We update lastLogin here because we expect that on each our request
        // the backend will send us (if necessary) a fresh JWT, so we say that
        // JWT is refreshed.
        this.authService.refreshedJwt();
        this.authService.confirmPresence();

        const idToken = localStorage.getItem(Tags.ID_TOKEN);
        if (!idToken) return next.handle(req);

        const newReq = req.clone({
            headers: req.headers.set("Authorization", "Bearer " + idToken)
        });
        return next.handle(newReq);
    }
}
