import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { AlertController, LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

declare global {
  interface Window {
    google?: any;
  }
}

@Component({
  selector: 'app-menu-login',
  templateUrl: './menu-login.page.html',
  styleUrls: ['./menu-login.page.scss'],
  standalone: false,
})
export class MenuLoginPage implements OnInit {
  private googleTokenClient: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private zone: NgZone
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    if (this.authService.getToken()) {
      this.router.navigate(['/home'], { replaceUrl: true });
    }
  }

  async loginWithGoogle() {
    if (!environment.googleClientId) {
      await this.showAlert('Google Login Belum Siap', 'Google Client ID belum dikonfigurasi.');
      return;
    }

    if (Capacitor.getPlatform() === 'android') {
      await this.loginWithNativeGoogle();
      return;
    }

    try {
      await this.waitForGoogleScript();
      this.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: environment.googleClientId,
        scope: 'openid email profile',
        callback: (response: any) => this.zone.run(() => this.handleGoogleResponse(response)),
      });

      this.googleTokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (error) {
      console.error('Google script error:', error);
      await this.showAlert('Google Login Gagal', 'Layanan Google belum siap. Coba lagi beberapa saat.');
    }
  }

  private async loginWithNativeGoogle() {
    const loading = await this.loadingCtrl.create({
      message: 'Masuk dengan Google...',
    });

    try {
      await loading.present();
      await SocialLogin.initialize({
        google: {
          webClientId: environment.googleClientId,
          mode: 'online',
        },
      });

      const response: any = await SocialLogin.login({
        provider: 'google',
        options: {},
      });

      const googleResult = response?.result || response;
      const accessToken = googleResult?.accessToken?.token || googleResult?.accessToken;
      const googleToken = googleResult?.idToken || accessToken;

      if (!googleToken) {
        throw new Error('Token Google tidak diterima dari Android.');
      }

      this.authService.googleLogin(googleToken).subscribe({
        next: async () => {
          await loading.dismiss();
          await this.router.navigate(['/home']);
        },
        error: async (err) => {
          console.error('Google login backend error:', err);
          await loading.dismiss();
          await this.showAlert('Google Login Gagal', err.error?.message || 'Terjadi kesalahan saat masuk dengan Google.');
        }
      });
    } catch (error: any) {
      console.error('Native Google login error:', error);
      await loading.dismiss();
      const errMsg = error?.message || error?.error || JSON.stringify(error);
      if (errMsg.toLowerCase().includes('cancel') || errMsg.toLowerCase().includes('dibatalkan')) {
        return;
      }
      await this.showAlert('Google Login Gagal', `Detail Error: ${errMsg}. Pastikan OAuth Android memakai package com.fivgo.app dan SHA-1 yang benar.`);
    }
  }

  private waitForGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);
          resolve();
        }

        if (attempts >= 30) {
          clearInterval(interval);
          reject(new Error('Google Identity Services tidak berhasil dimuat.'));
        }
      }, 100);
    });
  }

  private async handleGoogleResponse(response: any) {
    if (!response?.access_token) {
      await this.showAlert('Google Login Gagal', 'Token Google tidak diterima.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Masuk dengan Google...',
    });
    await loading.present();

    this.authService.googleLogin(response.access_token).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.router.navigate(['/home']);
      },
      error: async (err) => {
        console.error('Google login backend error:', err);
        await loading.dismiss();
        await this.showAlert('Google Login Gagal', err.error?.message || 'Terjadi kesalahan saat masuk dengan Google.');
      }
    });
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
