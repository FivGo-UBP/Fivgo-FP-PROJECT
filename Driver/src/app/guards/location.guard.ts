import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { Platform } from '@ionic/angular';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx';

export const locationGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const platform = inject(Platform);
  const diagnostic = inject(Diagnostic);
  
  try {
    await platform.ready();

    // Bypass jika dijalankan di web (localhost) untuk testing
    if (!platform.is('capacitor') && !platform.is('cordova')) {
      return true;
    }

    let check = await Geolocation.checkPermissions();
    
    if (check.location === 'granted') {
      try {
        // Cek secara instan apakah GPS perangkat menyala (tidak perlu memanggil satelit GPS)
        const isLocationEnabled = await diagnostic.isLocationEnabled();
        if (isLocationEnabled) {
          return true; // GPS menyala dan izin ada, langsung masuk ke Home/Tabs
        } else {
          // GPS mati, arahkan ke halaman aktivasi
          return router.parseUrl('/aktivasi-lokasi');
        }
      } catch (e) {
        console.warn("Diagnostic check failed, fallback to permission", e);
        // Fallback jika diagnostic gagal
        return router.parseUrl('/aktivasi-lokasi');
      }
    } else {
      // Jika izin prompt/denied, arahkan ke halaman aktivasi
      return router.parseUrl('/aktivasi-lokasi');
    }
  } catch (error: any) {
    // OS-PLUG-GLOC-0007 artinya GPS mati
    if (error && error.code === 'OS-PLUG-GLOC-0007') {
      return router.parseUrl('/aktivasi-lokasi');
    }
    console.error('Error in location guard:', error);
    return router.parseUrl('/aktivasi-lokasi'); 
  }
};
