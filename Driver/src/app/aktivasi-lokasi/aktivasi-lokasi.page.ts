import { Component, OnInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Router } from '@angular/router';
import { LocationAccuracy } from '@awesome-cordova-plugins/location-accuracy/ngx';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-aktivasi-lokasi',
  templateUrl: './aktivasi-lokasi.page.html',
  styleUrls: ['./aktivasi-lokasi.page.scss'],
  standalone: false,
})
export class AktivasiLokasiPage implements OnInit {

  constructor(
    private router: Router,
    private locationAccuracy: LocationAccuracy,
    private diagnostic: Diagnostic,
    private platform: Platform
  ) { }

  ngOnInit() {
  }

  async ionViewDidEnter() {
    setTimeout(() => {
      this.requestLocationAccess();
    }, 500);
  }

  async requestLocationAccess() {
    // Bypass jika dijalankan di web browser lokal
    if (!this.platform.is('capacitor') && !this.platform.is('cordova')) {
      this.router.navigateByUrl('/', { replaceUrl: true });
      return;
    }

    try {
      let check = await Geolocation.checkPermissions();
      
      if (check.location !== 'granted') {
        check = await Geolocation.requestPermissions();
      }

      if (check.location === 'granted') {
        this.requestGpsActivation();
      } else {
        alert('Aplikasi membutuhkan izin lokasi. Anda akan diarahkan ke pengaturan aplikasi.');
        this.diagnostic.switchToSettings();
      }
    } catch (error: any) {
      const errStr = JSON.stringify(error) || '';
      if (errStr.includes('OS-PLUG-GLOC-0007') || (error && error.code === 'OS-PLUG-GLOC-0007')) {
        this.requestGpsActivation();
      } else {
        console.error('Error saat meminta akses lokasi:', error);
        alert('Terjadi kesalahan saat mengecek izin: ' + errStr);
      }
    }
  }

  async requestGpsActivation() {
    try {
      await this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
      
      this.tryGetLocationAndRedirect();
    } catch (e) {
      console.warn("LocationAccuracy error/ditolak:", e);
      try {
        this.diagnostic.switchToLocationSettings();
      } catch (diagError) {
        alert('Tolong nyalakan Lokasi (GPS) Anda secara manual di menu Pengaturan HP.');
      }
    }
  }

  async tryGetLocationAndRedirect() {
    try {
      const isLocationEnabled = await this.diagnostic.isLocationEnabled();
      if (isLocationEnabled) {
        this.router.navigateByUrl('/', { replaceUrl: true });
      } else {
        alert('Gagal memverifikasi lokasi. Pastikan fitur GPS di perangkat Anda sudah menyala penuh.');
      }
    } catch (error) {
      console.warn("Verifikasi gagal:", error);
      this.router.navigateByUrl('/', { replaceUrl: true });
    }
  }

  openSettings() {
    // Tombol darurat jika popup GPS gagal muncul, buka pengaturan lokasi Android
    try {
      this.diagnostic.switchToLocationSettings();
    } catch (error) {
      alert('Tolong nyalakan Lokasi (GPS) Anda secara manual di menu Pengaturan HP.');
    }
  }

}

