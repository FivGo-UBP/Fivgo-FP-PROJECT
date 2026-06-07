import { NgModule, Injectable, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, Router } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthService } from './services/auth.service';
import { LocationAccuracy } from '@awesome-cordova-plugins/location-accuracy/ngx';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';

import { registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';
registerLocaleData(localeId, 'id-ID');

@Injectable()
export class InlineAuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const isApiUrl = request.url.startsWith('http://localhost') || request.url.includes('/api/');
    
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
          this.router.navigate(['/welcome-page']);
        }
        return throwError(() => error);
      })
    );
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: InlineAuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'id-ID' },
    LocationAccuracy,
    Diagnostic
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
