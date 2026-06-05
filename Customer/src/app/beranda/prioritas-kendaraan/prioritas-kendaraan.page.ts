import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-prioritas-kendaraan',
  templateUrl: './prioritas-kendaraan.page.html',
  styleUrls: ['./prioritas-kendaraan.page.scss'],
  standalone: false,
})
export class PrioritasKendaraanPage implements OnInit {
  vehicle: string = '';
  recentLocations: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.back();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params && params['vehicle']) {
        this.vehicle = params['vehicle'];
      }
    });

    this.loadHistory();
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  loadHistory() {
    const storedTujuan = localStorage.getItem('historyTujuan');
    if (storedTujuan) {
      this.recentLocations = JSON.parse(storedTujuan).slice(0, 5);
    } else {
      this.recentLocations = [];
    }
  }

  goToOrder() {
    this.router.navigate(['/order'], { queryParams: { vehicle: this.vehicle } });
  }

  async selectLocation(loc: any) {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;

      const tujuanLat = loc.originalResult?.position?.lat;
      const tujuanLng = loc.originalResult?.position?.lon;

      this.router.navigate(['/map-visual'], {
        queryParams: {
          jemput: 'Lokasi Saat Ini',
          jLat: currentLat,
          jLng: currentLng,
          tujuan: loc.name,
          tLat: tujuanLat,
          tLng: tujuanLng,
          vehicle: this.vehicle
        }
      });
    } catch (error) {
      console.error('Error getting current location', error);
      // Fallback: if GPS fails, go to /order page with the destination selected
      this.router.navigate(['/order'], { queryParams: { vehicle: this.vehicle } });
    }
  }
}
