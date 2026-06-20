import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { TomtomService } from '../../services/tomtom.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-pilih-penjemputan',
  templateUrl: './pilih-penjemputan.page.html',
  styleUrls: ['./pilih-penjemputan.page.scss'],
  standalone: false,
})
export class PilihPenjemputanPage implements OnInit {

  activeTab: string = 'terakhir';
  
  // Variabel untuk riwayat dan API
  recentLocations: any[] = [];
  searchKeyword: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  searchTimeout: any;
  currentLat: number = 0;
  currentLng: number = 0;
  currentLocationName: string = 'Mencari lokasi...';
  savedLocations: any[] = [];
  showDeleteConfirm: boolean = false;
  pendingDeleteLoc: any = null;

  constructor(
    private tomtomService: TomtomService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.back();
  }

  ngOnInit() {
    this.getCurrentLocation();
    this.loadHistory();
    this.loadSavedLocations();
  }

  ionViewWillEnter() {
    this.getCurrentLocation();
    this.loadSavedLocations();
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
  
  async getCurrentLocation() {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location !== 'granted') {
        this.currentLocationName = 'Izin lokasi ditolak';
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
            if (addr.poi && addr.poi.name) {
              this.currentLocationName = addr.poi.name;
            } else if (addr.address && addr.address.streetName) {
              this.currentLocationName = addr.address.streetName;
            } else if (addr.address && addr.address.freeformAddress) {
              const parts = addr.address.freeformAddress.split(',');
              this.currentLocationName = parts[0].trim();
            } else {
              this.currentLocationName = 'Lokasi saat ini';
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.currentLocationName = 'Lokasi saat ini';
          this.cdr.detectChanges();
        }
      });
      
    } catch (error) {
      this.currentLocationName = 'Lokasi saat ini';
      this.cdr.detectChanges();
    }
  }

  loadHistory() {
    // Karena ini halaman pilih penjemputan, ambil riwayat jemput
    const storedHistory = localStorage.getItem('historyJemput');
    if (storedHistory) {
      this.recentLocations = JSON.parse(storedHistory).map((item: any) => {
        return {
          name: item.name,
          address: item.address,
          originalResult: item.originalResult,
          icon: 'time-outline'
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
            this.searchResults = [];
          }
        });
      }, 500);
    } else {
      this.isSearching = false;
      this.searchResults = [];
    }
  }

  selectResult(loc: any) {
    // Menyimpan riwayat pencarian penjemputan
    const historyItem = {
      name: loc.name,
      address: loc.address,
      originalResult: loc.originalResult
    };
    
    let historyJemput: any[] = [];
    const storedHistory = localStorage.getItem('historyJemput');
    if (storedHistory) {
      historyJemput = JSON.parse(storedHistory);
    }
    historyJemput = [historyItem, ...historyJemput.filter((i: any) => i.name !== historyItem.name)].slice(0, 5);
    localStorage.setItem('historyJemput', JSON.stringify(historyJemput));
    
    // Karena ini milih penjemputan (origin), navigasi kembali ke 'cari-lokasi' atau ke mana?
    // Biasanya navigasi kembali ke cari-lokasi dan set nilai jemput-nya jika ada local state,
    // Atau bisa ke /map-visual? Jika ini flow order manual, kita bisa pass via Router state/queryParams,
    // Atau simpan ke variable global/localStorage bahwa pick-up location sudah diubah.
    
    localStorage.setItem('tempJemputName', loc.name);
    const jLat = loc.originalResult?.position?.lat || this.currentLat;
    const jLng = loc.originalResult?.position?.lon || this.currentLng;
    localStorage.setItem('tempJemputLat', jLat.toString());
    localStorage.setItem('tempJemputLng', jLng.toString());
    
    this.router.navigate(['/cari-lokasi']);
  }

  async selectCurrentLocation() {
    this.currentLocationName = 'Mencari lokasi terbaru...';
    this.cdr.detectChanges();
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location !== 'granted') {
        this.currentLocationName = 'Izin lokasi ditolak';
        this.cdr.detectChanges();
        return;
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      this.currentLat = position.coords.latitude;
      this.currentLng = position.coords.longitude;

      this.tomtomService.reverseGeocode(this.currentLat, this.currentLng).subscribe({
        next: (res: any) => {
          let locationName = 'Lokasi Saat Ini';
          if (res && res.addresses && res.addresses.length > 0) {
            const addr = res.addresses[0];
            if (addr.poi && addr.poi.name) {
              locationName = addr.poi.name;
            } else if (addr.address && addr.address.streetName) {
              locationName = addr.address.streetName;
            } else if (addr.address && addr.address.freeformAddress) {
              locationName = addr.address.freeformAddress.split(',')[0].trim();
            }
          }
          this.currentLocationName = locationName;
          
          localStorage.setItem('tempJemputName', locationName);
          localStorage.setItem('tempJemputLat', this.currentLat.toString());
          localStorage.setItem('tempJemputLng', this.currentLng.toString());
          
          this.router.navigate(['/cari-lokasi']);
        },
        error: (err) => {
          console.error('Error reverse geocoding in selectCurrentLocation', err);
          localStorage.setItem('tempJemputName', 'Lokasi Saat Ini');
          localStorage.setItem('tempJemputLat', this.currentLat.toString());
          localStorage.setItem('tempJemputLng', this.currentLng.toString());
          this.router.navigate(['/cari-lokasi']);
        }
      });
    } catch (error) {
      console.error('Error getting fresh location in selectCurrentLocation:', error);
      this.currentLocationName = 'Gagal mendapatkan lokasi';
      this.cdr.detectChanges();
    }
  }

  loadSavedLocations() {
    const stored = localStorage.getItem('savedLocations');
    if (stored) {
      try {
        this.savedLocations = JSON.parse(stored);
      } catch (e) {
        this.savedLocations = [];
      }
    } else {
      this.savedLocations = [];
    }
  }

  deleteSavedLocation(loc: any, event: Event) {
    event.stopPropagation();
    this.pendingDeleteLoc = loc;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    if (!this.pendingDeleteLoc) return;
    const stored = localStorage.getItem('savedLocations');
    if (stored) {
      try {
        let saved = JSON.parse(stored);
        saved = saved.filter((i: any) => i.name !== this.pendingDeleteLoc.name || i.address !== this.pendingDeleteLoc.address);
        localStorage.setItem('savedLocations', JSON.stringify(saved));
        this.savedLocations = saved;
      } catch (e) {
        console.error('Error deleting saved location', e);
      }
    }
    this.showDeleteConfirm = false;
    this.pendingDeleteLoc = null;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteLoc = null;
  }

  getSavedIcon(label: string): string {
    const cleanLabel = (label || '').toLowerCase().trim();
    if (cleanLabel === 'rumah') {
      return 'home';
    } else if (cleanLabel === 'kantor') {
      return 'briefcase';
    } else if (cleanLabel === 'lainnya') {
      return 'location';
    }
    return 'bookmark';
  }
}
