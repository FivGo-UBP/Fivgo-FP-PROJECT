import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { OrderService } from '../../services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-promo',
  templateUrl: './promo.page.html',
  styleUrls: ['./promo.page.scss'],
  standalone: false,
})
export class PromoPage implements OnInit {
  user: User | null = null;
  selectedPromo: any = null;
  completedMotorCount: number = 0;
  completedMobilCount: number = 0;

  promotions: any[] = [];
  isLoading: boolean = true;
  loadError: boolean = false;

  constructor(
    private authService: AuthService,
    public langService: LanguageService,
    private router: Router,
    private navCtrl: NavController,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      if (user) {
        this.fetchOrderCounts();
      }
    });
    this.loadPromos();
  }

  ionViewWillEnter() {
    this.loadPromos();
    if (this.user) {
      this.fetchOrderCounts();
    }
  }

  loadPromos() {
    this.isLoading = true;
    this.loadError = false;
    this.orderService.getPromos().subscribe({
      next: (res) => {
        this.promotions = (res.data || []).map((p: any) => ({
          ...p,
          imageUrl: p.image ? `${environment.apiUrl.replace('/api', '')}/${p.image}` : null,
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal memuat promo:', err);
        this.isLoading = false;
        this.loadError = true;
        this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Gagal memuat riwayat order:', err)
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

  /** Format diskon untuk ditampilkan di kartu */
  getDiscountLabel(promo: any): string {
    let label = `Diskon ${promo.discount_percent}%`;
    if (promo.max_discount) {
      label += ` (maks. Rp${(promo.max_discount).toLocaleString('id-ID')})`;
    }
    return label;
  }

  /** Format tanggal berlaku */
  getDateLabel(promo: any): string {
    if (!promo.end_date) return this.isIndonesian ? 'Selamanya' : 'No expiry';
    const end = new Date(promo.end_date);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `s.d. ${end.toLocaleDateString('id-ID', opts)}`;
  }

  openPromo(promo: any) {
    this.selectedPromo = promo;
  }

  usePromo(promo: any) {
    this.selectedPromo = null;
    localStorage.setItem('tempPromoCode', promo.code);
    let service = 'motor';
    const code = (promo.code || '').toUpperCase();
    if (code.includes('MOBIL') || (promo.applicable_vehicles && promo.applicable_vehicles.includes('mobil'))) {
      service = 'mobil';
    }
    localStorage.setItem('selectedPayment', 'wallet');
    this.router.navigate(['/prioritas-kendaraan'], { queryParams: { vehicle: service } });
  }

  goBack() {
    this.navCtrl.back();
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  get isIndonesian(): boolean {
    return this.langService.getLanguage() === 'id';
  }
}
