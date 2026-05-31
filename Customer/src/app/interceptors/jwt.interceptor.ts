import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private router: Router) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add auth header with jwt if account is logged in and request is to the api url
        const token = localStorage.getItem('jwt_token');
        const isApiUrl = request.url.startsWith(environment.apiUrl);
        
        if (token && isApiUrl) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error) => {
                if (error.status === 401) {
                    localStorage.removeItem('jwt_token');
                    localStorage.removeItem('user');
                    this.router.navigate(['/landing-page']);
                }
                return throwError(() => error);
            })
        );
    }
}
