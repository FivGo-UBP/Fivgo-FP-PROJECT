import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Hide Capacitor native splash screen immediately
      SplashScreen.hide().catch(err => {
        console.warn('Native SplashScreen hide failed or not running in native environment', err);
      });

      // Show our premium custom splash screen animation for 2.5 seconds
      setTimeout(() => {
        const splashEl = document.getElementById('custom-splash');
        if (splashEl) {
          splashEl.classList.add('fade-out');
          // Remove the splash screen from DOM after circular reveal transition finishes (900ms)
          setTimeout(() => {
            splashEl.remove();
          }, 900);
        }
      }, 7000);
    });
  }
}
