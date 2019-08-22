import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const idToken = localStorage.getItem(this.authService.idTokenTag);
        if (!idToken) return next.handle(req);

        const newReq = req.clone({
            headers: req.headers.set("Authorization", "Bearer " + idToken)
        });
        return next.handle(newReq);
    }
}
