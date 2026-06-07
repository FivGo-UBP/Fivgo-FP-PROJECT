import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-alamat-tersimpan',
  templateUrl: './alamat-tersimpan.page.html',
  styleUrls: ['./alamat-tersimpan.page.scss'],
  standalone: false,
})
export class AlamatTersimpanPage implements OnInit {
  savedLocations: any[] = [];

  constructor(
    private navCtrl: NavController,
    private router: Router,
    public langService: LanguageService
  ) { }

  ngOnInit() {
    this.loadSavedLocations();
  }

  ionViewWillEnter() {
    this.loadSavedLocations();
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  goBack() {
    this.navCtrl.navigateBack('/kelola-profile');
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

  selectAddress(loc: any) {
    const lat = loc.originalResult?.position?.lat || '';
    const lng = loc.originalResult?.position?.lon || '';
    
    this.router.navigate(['/order'], {
      queryParams: {
        tujuan: loc.name || loc.label,
        address: loc.address,
        tLat: lat,
        tLng: lng
      }
    });
  }

  getSavedIcon(label: string): string {
    const cleanLabel = (label || '').toLowerCase().trim();
    if (cleanLabel === 'rumah' || cleanLabel === 'home') {
      return 'home';
    } else if (cleanLabel === 'kantor' || cleanLabel === 'office' || cleanLabel === 'work') {
      return 'briefcase';
    } else if (cleanLabel === 'lainnya') {
      return 'location';
    }
    return 'bookmark';
  }
}
