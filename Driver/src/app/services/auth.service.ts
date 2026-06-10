import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
    id: string;
    role: string;
    name?: string;
    is_new_user?: boolean;
    phone?: string;
    email?: string;
    photo?: string;
    gender?: string;
    email_verified_at?: string;
    phone_verified_at?: string;
    driver_profile?: {
        id: string;
        status: string;
        rating: string;
        vehicle_type: string;
        plate_number: string;
        wallet_balance: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject: BehaviorSubject<User | null>;
    public currentUser: Observable<User | null>;
    public isSessionInitialized: boolean = false;

    constructor(private http: HttpClient) {
        const userStr = localStorage.getItem('user');
        this.currentUserSubject = new BehaviorSubject<User | null>(userStr ? JSON.parse(userStr) : null);
        this.currentUser = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    public getToken(): string | null {
        return localStorage.getItem('jwt_token');
    }

    requestOtp(phone: string, role: string, purpose: 'login' | 'register' = 'login') {
        return this.http.post<any>(`${environment.apiUrl}/auth/request-otp`, { phone, role, purpose });
    }

    verifyOtp(phone: string, role: string, otp: string, purpose: 'login' | 'register' = 'login') {
        return this.http.post<any>(`${environment.apiUrl}/auth/verify-otp`, { phone, role, otp, purpose })
            .pipe(tap(response => {
                if (response.token) {
                    localStorage.setItem('jwt_token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                }
                return response;
            }));
    }

    googleLogin(googleToken: string) {
        return this.http.post<any>(`${environment.apiUrl}/auth/google-login`, { google_token: googleToken })
            .pipe(tap(response => {
                if (response.token) {
                    localStorage.setItem('jwt_token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                }
                return response;
            }));
    }

    updateName(name: string) {
        return this.http.put<any>(`${environment.apiUrl}/drivers/me`, { name }).pipe(
            tap(user => {
                const currentUser = this.currentUserValue;
                const updatedUser = { ...currentUser, ...user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                this.currentUserSubject.next(updatedUser);
            })
        );
    }

    updateProfile(formData: FormData) {
        return this.http.post<User>(`${environment.apiUrl}/drivers/me`, formData, {
            headers: {
                // Let the browser set Content-Type for multipart/form-data
                'X-HTTP-Method-Override': 'PUT'
            }
        }).pipe(
            tap(user => {
                const currentUser = this.currentUserValue;
                const updatedUser = { ...currentUser, ...user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                this.currentUserSubject.next(updatedUser);
            })
        );
    }

    getProfile() {
        return this.http.get<User>(`${environment.apiUrl}/drivers/me`).pipe(
            tap(user => {
                const currentUser = this.currentUserValue;
                const updatedUser = { ...currentUser, ...user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                this.currentUserSubject.next(updatedUser);
            })
        );
    }

    requestPhoneChangeOtp(newPhone: string) {
        return this.http.post<any>(`${environment.apiUrl}/drivers/request-phone-change-otp`, { new_phone: newPhone });
    }

    changePhone(newPhone: string, otp: string) {
        return this.http.post<any>(`${environment.apiUrl}/drivers/change-phone`, { new_phone: newPhone, otp }).pipe(
            tap(res => {
                if (res.user) {
                    const updatedUser = { ...this.currentUserValue, ...res.user };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUserSubject.next(updatedUser);
                }
            })
        );
    }

    logout() {
        return this.http.post<any>(`${environment.apiUrl}/auth/logout`, {}).pipe(
            tap(() => this.clearAuth()),
            catchError(err => {
                this.clearAuth();
                throw err;
            })
        );
    }

    private clearAuth() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }
}
