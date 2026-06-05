import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { OrderService } from '../../services/order.service';

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

  promotions: any[] = [
    {
      id: 1,
      image: 'assets/promo_10x_motor.png',
      title: '10x Order FivGO Motor',
      titleEn: '10x Order FivGO Motor',
      desc: 'Dapatkan voucher diskon setelah 10x order FivGO Motor diskon Rp10rb*',
      descEn: 'Get a discount voucher after 10x FivGO Motor orders discount Rp10k*',
      code: 'FIVGOMOTOR10X',
      terms: [
        'Berlaku setelah menyelesaikan 10x pemesanan FivGO Motor.',
        'Potongan langsung sebesar Rp 10.000.',
        'Hanya berlaku untuk layanan FivGO Motor.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Valid after completing 10x FivGO Motor orders.',
        'Direct discount of Rp 10,000.',
        'Only applicable for FivGO Motor service.',
        'Valid until December 31, 2026.'
      ]
    },
    {
      id: 2,
      image: 'assets/promo_mobil.png',
      title: 'Pertama Kali Naik Fivgo Mobil',
      titleEn: 'First Ride Fivgo Mobil',
      desc: 'Pertama kali naik Fivgo mobil mendapatkan voucher diskon Rp8.5rb*',
      descEn: 'First time riding Fivgo Mobil gets a discount voucher of Rp8.5k*',
      code: 'FIVGOMOBILBARU',
      terms: [
        'Hanya berlaku untuk perjalanan pertama kali menggunakan Fivgo Mobil.',
        'Potongan langsung sebesar Rp 8.500.',
        'Hanya berlaku untuk layanan FivgoMobil.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Only applicable for first time riding Fivgo Mobil.',
        'Direct discount of Rp 8,500.',
        'Only applicable for FivgoMobil service.',
        'Valid until December 31, 2026.'
      ]
    },
    {
      id: 3,
      image: 'assets/promo_motor.png',
      title: 'Pertama Kali Naik Fivgo Motor',
      titleEn: 'First Ride Fivgo Motor',
      desc: 'Pertama kali naik Fivgo motor mendapatkan voucher diskon Rp5rb*',
      descEn: 'First time riding Fivgo Motor gets a discount voucher of Rp5k*',
      code: 'FIVGOMOTORBARU',
      terms: [
        'Hanya berlaku untuk perjalanan pertama kali menggunakan Fivgo Motor.',
        'Potongan langsung sebesar Rp 5.000.',
        'Hanya berlaku untuk layanan FivgoMotor.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Only applicable for first time riding Fivgo Motor.',
        'Direct discount of Rp 5,000.',
        'Only applicable for FivgoMotor service.',
        'Valid until December 31, 2026.'
      ]
    }
  ];

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
  }

  ionViewWillEnter() {
    if (this.user) {
      this.fetchOrderCounts();
    }
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
    let service = 'motor';
    if (promo.code.toUpperCase().includes('MOBIL')) {
      service = 'mobil';
    }
    // Set payment preference to non-cash (wallet) to avoid promo block
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
