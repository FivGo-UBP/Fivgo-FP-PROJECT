import { Component, ChangeDetectorRef } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { TomtomService } from '../../services/tomtom.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-cari-lokasi',
  templateUrl: './cari-lokasi.page.html',
  styleUrls: ['./cari-lokasi.page.scss'],
  standalone: false,
})
export class CariLokasiPage {

  currentLocation: string = 'Mencari lokasi...';
  recentLocations: any[] = [];
  
  // Variabel untuk pencarian
  searchKeyword: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  searchTimeout: any;
  currentLat: number = 0;
  currentLng: number = 0;

  constructor(
    private tomtomService: TomtomService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.back();
  }

  ionViewWillEnter() {
    this.loadHistory();
    const tempJemput = localStorage.getItem('tempJemputName');
    if (tempJemput) {
      this.currentLocation = tempJemput;
      this.currentLat = parseFloat(localStorage.getItem('tempJemputLat') || '0');
      this.currentLng = parseFloat(localStorage.getItem('tempJemputLng') || '0');
    } else {
      this.getCurrentLocation();
    }
  }

  async getCurrentLocation() {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location !== 'granted') {
        this.currentLocation = 'Izin lokasi ditolak';
        this.cdr.detectChanges();
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      this.currentLat = lat;
      this.currentLng = lng;
      
      this.tomtomService.reverseGeocode(lat, lng).subscribe({
        next: (res: any) => {
          if (res && res.addresses && res.addresses.length > 0) {
            const addr = res.addresses[0];
            // Coba ambil nama tempat (POI) atau nama jalan murni (streetName) agar nomor rumah/detail lain tidak ikut
            if (addr.poi && addr.poi.name) {
              this.currentLocation = addr.poi.name;
            } else if (addr.address && addr.address.streetName) {
              this.currentLocation = addr.address.streetName;
            } else if (addr.address && addr.address.freeformAddress) {
              const parts = addr.address.freeformAddress.split(',');
              this.currentLocation = parts[0].trim();
            } else {
              this.currentLocation = 'Lokasi tidak diketahui';
            }
          } else {
            this.currentLocation = 'Lokasi tidak diketahui';
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error reverse geocoding', err);
          this.currentLocation = 'Gagal memuat alamat';
          this.cdr.detectChanges();
        }
      });
      
    } catch (error) {
      console.error('Error getting location', error);
      this.currentLocation = 'Gagal mendapatkan lokasi';
      this.cdr.detectChanges();
    }
  }

  loadHistory() {
    // Mengambil riwayat pencarian tujuan (atau jemput, tergantung konteks pencarian ini)
    const storedHistory = localStorage.getItem('historyTujuan');
    if (storedHistory) {
      const historyArr = JSON.parse(storedHistory);
      this.recentLocations = historyArr.map((item: any, index: number) => {
        return {
          name: item.name,
          address: item.address || 'Detail alamat tidak tersedia',
          isRecent: index === 0, // Set badge 'baru digunakan' hanya untuk item pertama (paling terakhir digunakan)
          icon: 'time-outline',
          originalResult: item.originalResult
        };
      });
    }
  }

  onSearch(event: any) {
    const query = event.target.value;
    this.searchKeyword = query;
    this.performSearch(query);
  }

  performSearch(query: string) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    if (query && query.trim() !== '') {
      this.isSearching = true;
      
      this.searchTimeout = setTimeout(() => {
        const searchLat = this.currentLat !== 0 ? this.currentLat : undefined;
        const searchLng = this.currentLng !== 0 ? this.currentLng : undefined;
        
        this.tomtomService.searchAddress(query, searchLng, searchLat).subscribe({
          next: (res: any) => {
            if (res && res.results) {
              this.searchResults = res.results.map((result: any) => {
                let name = '';
                if (result.poi && result.poi.name) {
                  name = result.poi.name;
                } else if (result.address && result.address.freeformAddress) {
                  const parts = result.address.freeformAddress.split(',');
                  name = parts[0].trim();
                } else {
                  name = result.address.localName || 'Lokasi tidak diketahui';
                }
                const address = result.address.freeformAddress;
                
                return { name, address, originalResult: result };
              });
            } else {
              this.searchResults = [];
            }
          },
          error: (err) => {
            console.error('Error searching address', err);
            this.searchResults = [];
          }
        });
      }, 500);
    } else {
      this.isSearching = false;
      this.searchResults = [];
    }
  }

  async selectResult(loc: any) {
    console.log('Lokasi dipilih:', loc);
    
    // Siapkan parameter untuk ke halaman map-visual
    const tujuanLat = loc.originalResult?.position?.lat || 0;
    const tujuanLng = loc.originalResult?.position?.lon || 0;
    
    let finalJemputLat = this.currentLat;
    let finalJemputLng = this.currentLng;

    if (this.currentLocation.toLowerCase() === 'lokasi saat ini' || this.currentLocation.toLowerCase() === 'lokasi tidak diketahui') {
      try {
        let perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          perm = await Geolocation.requestPermissions();
        }
        if (perm.location === 'granted') {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
          finalJemputLat = position.coords.latitude;
          finalJemputLng = position.coords.longitude;
          this.currentLat = finalJemputLat;
          this.currentLng = finalJemputLng;
        }
      } catch (error) {
        console.warn('Gagal mendapatkan lokasi terbaru sebelum navigasi di cari-lokasi, menggunakan cache:', error);
      }
    }

    // Menyimpan riwayat pencarian
    const historyItem = {
      name: loc.name,
      address: loc.address,
      originalResult: loc.originalResult
    };
    
    // Simpan ke local storage agar muncul di riwayat selanjutnya
    let historyTujuan: any[] = [];
    const storedHistory = localStorage.getItem('historyTujuan');
    if (storedHistory) {
      historyTujuan = JSON.parse(storedHistory);
    }
    historyTujuan = [historyItem, ...historyTujuan.filter((i: any) => i.name !== historyItem.name)].slice(0, 5);
    localStorage.setItem('historyTujuan', JSON.stringify(historyTujuan));
    
    // Navigasi
    this.router.navigate(['/map-visual'], {
      queryParams: {
        jemput: this.currentLocation,
        jLat: finalJemputLat,
        jLng: finalJemputLng,
        tujuan: loc.name,
        tLat: tujuanLat,
        tLng: tujuanLng
      }
    });
  }

}
