import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { TomtomService } from '../../services/tomtom.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-simpan-lokasi',
  templateUrl: './simpan-lokasi.page.html',
  styleUrls: ['./simpan-lokasi.page.scss'],
  standalone: false,
})
export class SimpanLokasiPage implements OnInit {

  searchKeyword: string = '';
  searchResults: any[] = [];
  isSearching: boolean = false;
  selectedLocation: any = null;
  locationLabel: string = '';
  searchTimeout: any = null;
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

  ngOnInit() {
    this.getCurrentLocation();
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      this.currentLat = position.coords.latitude;
      this.currentLng = position.coords.longitude;
    } catch (error) {
      console.log('Error getting location for search biasing:', error);
    }
  }

  onSearch(event: any) {
    const query = event.detail?.value || event.target?.value || '';
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
            this.isSearching = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Tomtom search failed:', err);
            this.searchResults = [];
            this.isSearching = false;
            this.cdr.detectChanges();
          }
        });
      }, 500);
    } else {
      this.isSearching = false;
      this.searchResults = [];
    }
  }

  selectLocation(result: any) {
    this.selectedLocation = result;
    this.locationLabel = '';
  }

  saveLocation() {
    if (!this.selectedLocation) return;
    
    const newLoc = {
      label: this.locationLabel.trim() || this.selectedLocation.name,
      name: this.selectedLocation.name,
      address: this.selectedLocation.address,
      originalResult: this.selectedLocation.originalResult
    };
    
    let saved: any[] = [];
    const stored = localStorage.getItem('savedLocations');
    if (stored) {
      try {
        saved = JSON.parse(stored);
      } catch (e) {
        saved = [];
      }
    }
    
    // Filter duplicates
    saved = saved.filter((i: any) => i.name !== newLoc.name && i.address !== newLoc.address);
    saved.unshift(newLoc);
    
    localStorage.setItem('savedLocations', JSON.stringify(saved));
    
    this.selectedLocation = null;
    this.locationLabel = '';
    
    this.router.navigate(['/pilih-penjemputan']);
  }
}
