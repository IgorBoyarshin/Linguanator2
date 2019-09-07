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
        router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(_ => this.authService.resetPresenceTimer());
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        this.authService.resetPresenceTimer();

        const idToken = localStorage.getItem(Tags.ID_TOKEN);
        if (!idToken) return next.handle(req);

        const newReq = req.clone({
            headers: req.headers.set("Authorization", "Bearer " + idToken)
        });
        return next.handle(newReq);
    }
}
