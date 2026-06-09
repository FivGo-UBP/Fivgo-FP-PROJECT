import { Component, ViewChild } from '@angular/core';
import { Platform, AlertController, IonRouterOutlet } from '@ionic/angular';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  @ViewChild(IonRouterOutlet, { static: false }) routerOutlet?: IonRouterOutlet;
  private isAlertOpen = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private alertController: AlertController,
    private langService: LanguageService
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
      }, 1500);

      // Register custom hardware back button behavior
      this.setupBackButtonBehavior();
    });
  }

  setupBackButtonBehavior() {
    this.platform.backButton.subscribeWithPriority(10, async () => {
      const currentUrl = this.router.url;

      // 1. Jika berada di tab non-beranda (aktivitas, pesan, pembayaran), tekan back akan mengarahkan ke tab beranda
      if (
        currentUrl.startsWith('/tabs/aktivitas') ||
        currentUrl.startsWith('/tabs/pembayaran')
      ) {
        this.router.navigateByUrl('/tabs/beranda');
      } else if (currentUrl.startsWith('/tabs/pesan')) {
        // Jika sedang di dalam chat room (ada query param order_id), kembali ke list pesan
        if (currentUrl.includes('order_id=')) {
          this.router.navigateByUrl('/tabs/pesan');
        } else {
          // Jika sudah di list pesan, kembali ke beranda
          this.router.navigateByUrl('/tabs/beranda');
        }
      }
      // 2. Jika sudah di tab beranda atau root, tampilkan alert konfirmasi keluar
      else if (currentUrl === '/tabs/beranda' || currentUrl === '/') {
        await this.showExitAlert();
      }
      // 3. Untuk halaman lainnya, jika bisa kembali ke halaman sebelumnya, lakukan pop
      else {
        if (this.routerOutlet && this.routerOutlet.canGoBack()) {
          this.routerOutlet.pop();
        } else {
          // Jika tidak ada history back (misal di halaman login / welcome), tampilkan alert keluar
          await this.showExitAlert();
        }
      }
    });
  }

  async showExitAlert() {
    if (this.isAlertOpen) {
      return;
    }
    this.isAlertOpen = true;

    const headerText = this.langService.translate('exit.alert.title') || 'Keluar Aplikasi';
    const messageText = this.langService.translate('exit.alert.msg') || 'Apakah Anda yakin ingin keluar dari aplikasi FivGo?';
    const cancelText = this.langService.translate('exit.alert.cancel') || 'Batal';
    const confirmText = this.langService.translate('exit.alert.confirm') || 'Keluar';

    const alert = await this.alertController.create({
      header: headerText,
      message: messageText,
      buttons: [
        {
          text: cancelText,
          role: 'cancel',
          handler: () => {
            this.isAlertOpen = false;
          }
        },
        {
          text: confirmText,
          handler: () => {
            this.isAlertOpen = false;
            App.exitApp();
          }
        }
      ]
    });

    alert.onDidDismiss().then(() => {
      this.isAlertOpen = false;
    });

    await alert.present();
  }
}

