import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { NavController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { OrderService } from '../../services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-prioritas-kendaraan',
  templateUrl: './prioritas-kendaraan.page.html',
  styleUrls: ['./prioritas-kendaraan.page.scss'],
  standalone: false,
})
export class PrioritasKendaraanPage implements OnInit {
  vehicle: string = '';
  recentLocations: any[] = [];
  user: User | null = null;
  selectedPromo: any = null;
  completedMotorCount: number = 0;
  completedMobilCount: number = 0;
  promotions: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private authService: AuthService,
    public langService: LanguageService,
    private orderService: OrderService
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

    this.authService.currentUser.subscribe(user => {
      this.user = user;
      if (user) {
        this.fetchOrderCounts();
      }
    });

    this.loadHistory();
    this.loadPromos();
  }

  ionViewWillEnter() {
    this.loadHistory();
    this.loadPromos();
    if (this.user) {
      this.fetchOrderCounts();
    }
  }

  loadHistory() {
    const storedTujuan = localStorage.getItem('historyTujuan');
    if (storedTujuan) {
      this.recentLocations = JSON.parse(storedTujuan).slice(0, 5);
    } else {
      this.recentLocations = [];
    }
  }

  loadPromos() {
    this.orderService.getPromos().subscribe({
      next: (res) => {
        if (res && res.data) {
          const mappedPromos = res.data.map((p: any) => {
            const terms: string[] = [];
            const termsEn: string[] = [];

            if (p.description) {
              terms.push(p.description);
              termsEn.push(p.description);
            }
            if (p.min_order_amount) {
              terms.push(`Minimal order Rp${Number(p.min_order_amount).toLocaleString('id-ID')}`);
              termsEn.push(`Minimum order Rp${Number(p.min_order_amount).toLocaleString('id-ID')}`);
            }
            if (p.max_discount) {
              terms.push(`Maksimal diskon Rp${Number(p.max_discount).toLocaleString('id-ID')}`);
              termsEn.push(`Maximum discount Rp${Number(p.max_discount).toLocaleString('id-ID')}`);
            }
            if (p.quota) {
              const remaining = p.quota - (p.used_count || 0);
              terms.push(`Kuota tersisa: ${remaining}`);
              termsEn.push(`Remaining quota: ${remaining}`);
            }
            if (p.limit_per_user) {
              terms.push(`Maksimal ${p.limit_per_user}x penggunaan per pengguna`);
              termsEn.push(`Maximum ${p.limit_per_user}x uses per user`);
            }
            if (p.end_date) {
              const end = new Date(p.end_date);
              const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
              const dateStr = end.toLocaleDateString('id-ID', opts);
              terms.push(`Berlaku hingga s.d. ${dateStr}`);
              termsEn.push(`Valid until ${dateStr}`);
            }
            terms.push('Hanya berlaku dengan pembayaran non-tunai.');
            termsEn.push('Only valid with non-cash payment.');

            return {
              ...p,
              id: p.id,
              code: p.code,
              title: p.title,
              titleEn: p.title,
              desc: p.description || '',
              descEn: p.description || '',
              image: p.image ? `${environment.apiUrl.replace('/api', '')}/${p.image}` : 'assets/promo_placeholder.png',
              terms: terms,
              termsEn: termsEn
            };
          });

          // Shuffle promos
          mappedPromos.sort(() => Math.random() - 0.5);

          // Get first 4 cards randomly (matching new limit)
          this.promotions = mappedPromos.slice(0, 4);
        }
      },
      error: (err) => {
        console.error('Gagal memuat promo di prioritas-kendaraan:', err);
      }
    });
  }

  fetchOrderCounts() {
    this.orderService.getHistory().subscribe({
      next: (res) => {
        if (res && res.data) {
          const completedOrders = res.data.filter((o: any) => o.status === 'completed');
          this.completedMotorCount = completedOrders.filter((o: any) => o.vehicle_type === 'motor').length;
          this.completedMobilCount = completedOrders.filter((o: any) => o.vehicle_type === 'mobil').length;
        }
      },
      error: (err) => console.error('Gagal memuat riwayat order untuk perhitungan misi:', err)
    });
  }

  isPromoLocked(promoCode: string): boolean {
    const code = (promoCode || '').toUpperCase();
    if (code === 'FIVGOMOTOR10X') {
      return this.completedMotorCount < 10;
    }
    if (code === 'FIVGOMOBILBARU') {
      return this.completedMobilCount > 0;
    }
    if (code === 'FIVGOMOTORBARU') {
      return this.completedMotorCount > 0;
    }
    return false;
  }

  getPromoProgressMessage(promoCode: string): string {
    const code = (promoCode || '').toUpperCase();
    if (code === 'FIVGOMOTOR10X') {
      return this.isIndonesian 
        ? `Progres Misi: ${this.completedMotorCount}/10 Order Selesai` 
        : `Mission Progress: ${this.completedMotorCount}/10 Completed Orders`;
    }
    if (code === 'FIVGOMOBILBARU') {
      return this.completedMobilCount > 0 
        ? (this.isIndonesian ? 'Hanya untuk pengguna baru FivGO Mobil' : 'Only for new FivGO Mobil users')
        : (this.isIndonesian ? 'Berlaku untuk pengguna baru FivGO Mobil' : 'Applicable for new FivGO Mobil users');
    }
    if (code === 'FIVGOMOTORBARU') {
      return this.completedMotorCount > 0 
        ? (this.isIndonesian ? 'Hanya untuk pengguna baru FivGO Motor' : 'Only for new FivGO Motor users')
        : (this.isIndonesian ? 'Berlaku untuk pengguna baru FivGO Motor' : 'Applicable for new FivGO Motor users');
    }
    return '';
  }

  openPromo(promo: any) {
    this.selectedPromo = promo;
  }

  usePromo(promo: any) {
    this.selectedPromo = null;
    localStorage.setItem('tempPromoCode', promo.code);
    let service = this.vehicle || 'motor';
    const code = (promo.code || '').toUpperCase();
    if (code.includes('MOBIL') || (promo.applicable_vehicles && promo.applicable_vehicles.includes('mobil'))) {
      service = 'mobil';
    } else if (code.includes('MOTOR') || (promo.applicable_vehicles && promo.applicable_vehicles.includes('motor'))) {
      service = 'motor';
    }
    this.vehicle = service;
    localStorage.setItem('selectedPayment', 'wallet');
    this.goToOrder();
  }

  goToOrder() {
    this.router.navigate(['/order'], { queryParams: { vehicle: this.vehicle } });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  get isIndonesian(): boolean {
    return this.langService.getLanguage() === 'id';
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
      this.router.navigate(['/order'], { queryParams: { vehicle: this.vehicle } });
    }
  }
}
