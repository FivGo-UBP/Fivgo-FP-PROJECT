import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Logic pengecekan lokasi sekarang dipindahkan ke Angular Guard (location.guard.ts)
      
      // Sembunyikan splash screen bawaan Capacitor sesegera mungkin
      SplashScreen.hide().catch(err => {
        console.warn('Native SplashScreen hide failed or not running in native environment', err);
      });

      // Berikan waktu agar animasi gelombang terlihat premium (minimal 2.5 detik)
      setTimeout(() => {
        const splashEl = document.getElementById('custom-splash');
        if (splashEl) {
          splashEl.classList.add('fade-out');
          // Hapus elemen dari DOM setelah animasi transisi lingkaran (circle transition) selesai (900ms)
          setTimeout(() => {
            splashEl.remove();
          }, 900);
        }
      }, 2500);
    });
  }
}
