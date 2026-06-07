import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { TomtomService } from '../../services/tomtom.service';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-order',
  templateUrl: './order.page.html',
  styleUrls: ['./order.page.scss'],
  standalone: false,
})
export class OrderPage {
  segmentValue: string = 'terakhir';
  currentAddress: string = '';
  currentLat: number = 0;
  currentLng: number = 0;
  isSearching: boolean = false;
  searchResults: any[] = [];
  jemputKeyword: string = '';
  tujuanKeyword: string = '';
  activeField: 'jemput' | 'tujuan' = 'jemput';
  searchTimeout: any;
  vehicle: string = '';
  jemputLat: number = 0;
  jemputLng: number = 0;
  
  historyJemput: any[] = [];
  historyTujuan: any[] = [];
  hasProcessedPrefilled: boolean = false;

  constructor(
    private tomtomService: TomtomService,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.back();
  }

  ionViewWillEnter() {
    this.jemputKeyword = '';
    this.tujuanKeyword = '';
    this.searchResults = [];
    this.isSearching = false;
    this.activeField = 'jemput';
    this.hasProcessedPrefilled = false;
    
    // Load history
    const storedJemput = localStorage.getItem('historyJemput');
    if (storedJemput) this.historyJemput = JSON.parse(storedJemput);
    
    const storedTujuan = localStorage.getItem('historyTujuan');
    if (storedTujuan) this.historyTujuan = JSON.parse(storedTujuan);

    this.getCurrentLocation();

    this.route.queryParams.subscribe(params => {
      if (this.hasProcessedPrefilled) {
        return;
      }
      if (params && params['vehicle']) {
        this.vehicle = params['vehicle'];
      }
      if (params && params['tujuan']) {
        this.tujuanKeyword = params['tujuan'];
        this.activeField = 'tujuan';

        if (params['tLat'] && params['tLng']) {
          this.hasProcessedPrefilled = true;
          const locObj = {
            name: params['tujuan'],
            address: params['address'] || '',
            originalResult: {
              position: {
                lat: parseFloat(params['tLat']),
                lon: parseFloat(params['tLng'])
              }
            }
          };
          
          // Clear query parameters from URL history to avoid back-navigation loops
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tujuan: null, tLat: null, tLng: null, address: null, vehicle: null },
            queryParamsHandling: 'merge',
            replaceUrl: true
          });

          this.autoSelectPrefilledLocation(locObj);
        }
      }
    });
  }

  async autoSelectPrefilledLocation(loc: any) {
    let attempts = 0;
    while ((!this.jemputLat || !this.jemputLng) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    this.selectLocation(loc);
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      this.currentLat = lat;
      this.currentLng = lng;
      
      this.currentAddress = 'Mencari alamat...';
      
      this.tomtomService.reverseGeocode(lat, lng).subscribe({
        next: (res: any) => {
          if (res && res.addresses && res.addresses.length > 0) {
            this.currentAddress = res.addresses[0].address.freeformAddress;
          } else {
            this.currentAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          }
          
          if (!this.jemputKeyword) {
            this.jemputKeyword = 'Lokasi Saat Ini';
            this.jemputLat = lat;
            this.jemputLng = lng;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error reverse geocoding', err);
          this.currentAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          if (!this.jemputKeyword) {
            this.jemputKeyword = 'Lokasi Saat Ini';
            this.jemputLat = lat;
            this.jemputLng = lng;
            this.cdr.detectChanges();
          }
        }
      });
      
    } catch (error) {
      console.error('Error getting location', error);
      this.currentAddress = 'Gagal mendapatkan lokasi. Pastikan GPS aktif.';
      if (!this.jemputKeyword) {
        this.jemputKeyword = 'Lokasi Saat Ini';
        this.cdr.detectChanges();
      }
    }
  }

  onSearchJemput(event: any) {
    this.activeField = 'jemput';
    const query = event.target.value;
    this.jemputKeyword = query;
    this.performSearch(query);
  }

  onSearchTujuan(event: any) {
    this.activeField = 'tujuan';
    const query = event.target.value;
    this.tujuanKeyword = query;
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
        
        // Gunakan pencarian hybrid: TomTom + OpenStreetMap
        // OSM punya data universitas & tempat Indonesia yang lebih lengkap
        this.tomtomService.searchHybrid(query, searchLng, searchLat).subscribe({
          next: (results: any[]) => {
            this.searchResults = results;
          },
          error: (err) => {
            console.error('Error searching address', err);
            this.searchResults = [];
          }
        });
      }, 400);
    } else {
      this.isSearching = false;
      this.searchResults = [];
    }
  }
  
  saveToHistory(loc: any, type: 'jemput' | 'tujuan') {
    const historyItem = {
      name: loc.name,
      address: loc.address,
      originalResult: loc.originalResult // Keep original result so selectHistoryItem works seamlessly
    };

    if (type === 'jemput') {
      this.historyJemput = [historyItem, ...this.historyJemput.filter(i => i.name !== historyItem.name)].slice(0, 5);
      localStorage.setItem('historyJemput', JSON.stringify(this.historyJemput));
    } else {
      this.historyTujuan = [historyItem, ...this.historyTujuan.filter(i => i.name !== historyItem.name)].slice(0, 5);
      localStorage.setItem('historyTujuan', JSON.stringify(this.historyTujuan));
    }
  }

  async selectLocation(loc: any) {
    console.log('Lokasi pencarian dipilih:', loc);
    const selectedText = loc.name;
    
    if (this.activeField === 'jemput') {
      const dist = loc.originalResult?.dist;
      if (dist && dist > 1000) {
        const alert = await this.alertController.create({
          header: 'Tempat Penjemputannya Jauh',
          message: `Sepertinya alamat yang kamu masukkan ${selectedText} jauh dari lokasimu. Tetap memilih lokasi ini??`,
          buttons: [
            {
              text: 'Kembali',
              role: 'cancel',
            },
            {
              text: 'Lanjutkan',
              handler: () => {
                this.jemputKeyword = selectedText;
                if (loc.originalResult && loc.originalResult.position) {
                  this.jemputLat = loc.originalResult.position.lat;
                  this.jemputLng = loc.originalResult.position.lon;
                }
                this.saveToHistory(loc, 'jemput');
                this.isSearching = false;
              }
            }
          ]
        });
        await alert.present();
        return;
      }
      this.jemputKeyword = selectedText;
      if (loc.originalResult && loc.originalResult.position) {
        this.jemputLat = loc.originalResult.position.lat;
        this.jemputLng = loc.originalResult.position.lon;
      }
      this.saveToHistory(loc, 'jemput');
    } else {
      this.tujuanKeyword = selectedText;
      this.isSearching = false;
      this.saveToHistory(loc, 'tujuan');

      // Koordinat tujuan dari hasil pencarian
      const tujuanLat = loc.originalResult?.position?.lat;
      const tujuanLng = loc.originalResult?.position?.lon;

      // Gunakan koordinat GPS jika jemputLat/jemputLng belum ter-set (masih 0)
      let finalJemputLat = this.jemputLat;
      let finalJemputLng = this.jemputLng;

      if (this.jemputKeyword.toLowerCase() === 'lokasi saat ini') {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
          finalJemputLat = position.coords.latitude;
          finalJemputLng = position.coords.longitude;
          this.currentLat = finalJemputLat;
          this.currentLng = finalJemputLng;
        } catch (error) {
          console.warn('Gagal mendapatkan lokasi terbaru sebelum navigasi, menggunakan cache:', error);
          finalJemputLat = this.jemputLat !== 0 ? this.jemputLat : this.currentLat;
          finalJemputLng = this.jemputLng !== 0 ? this.jemputLng : this.currentLng;
        }
      } else {
        finalJemputLat = this.jemputLat !== 0 ? this.jemputLat : this.currentLat;
        finalJemputLng = this.jemputLng !== 0 ? this.jemputLng : this.currentLng;
      }

      if (!finalJemputLat || !finalJemputLng || isNaN(finalJemputLat) || isNaN(finalJemputLng)) {
        const alert = await this.alertController.create({
          header: 'Gagal Mendapatkan Lokasi',
          message: 'Pastikan GPS perangkat Anda aktif dan izin lokasi telah diberikan.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      this.router.navigate(['/map-visual'], {
        queryParams: {
          jemput: this.jemputKeyword,
          jLat: finalJemputLat,
          jLng: finalJemputLng,
          tujuan: this.tujuanKeyword,
          tLat: tujuanLat,
          tLng: tujuanLng,
          vehicle: this.vehicle
        }
      });
      return;
    }
    this.isSearching = false;
  }

  async selectCurrentLocation() {
    const originalAddress = this.currentAddress;
    this.currentAddress = 'Mencari lokasi terbaru...';
    this.cdr.detectChanges();
    try {
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
            this.currentAddress = res.addresses[0].address.freeformAddress;
          } else {
            this.currentAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          }
          this.jemputKeyword = 'Lokasi Saat Ini';
          this.jemputLat = lat;
          this.jemputLng = lng;
          this.isSearching = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error reverse geocoding inside selectCurrentLocation:', err);
          this.currentAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
          this.jemputKeyword = 'Lokasi Saat Ini';
          this.jemputLat = lat;
          this.jemputLng = lng;
          this.isSearching = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('Error getting fresh location in selectCurrentLocation:', error);
      this.currentAddress = originalAddress || 'Gagal mendapatkan lokasi terbaru';
      this.jemputKeyword = 'Lokasi Saat Ini';
      this.jemputLat = this.currentLat;
      this.jemputLng = this.currentLng;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }
}
