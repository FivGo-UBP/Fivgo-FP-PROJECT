import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { OrderService } from '../../services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: User | null = null;
  selectedPromo: any = null;
  selectedEducation: any = null;
  isCopied: boolean = false;
  completedMotorCount: number = 0;
  completedMobilCount: number = 0;

  promotions: any[] = [];

  educations: any[] = [
    {
      id: 1,
      image: 'assets/Pastikan driver sesuai aplikasi(2).png',
      title: 'Aman & Nyaman Bersama Fivgo',
      titleEn: 'Safe & Comfortable with Fivgo',
      desc: 'Keamanan Anda adalah prioritas utama kami. Fivgo berkomitmen menjaga Anda tetap aman di jalan.',
      descEn: 'Your safety is our top priority. Fivgo is committed to keeping you safe on the road.',
      tips: [
        'Pastikan plat nomor dan nama driver sesuai dengan data di aplikasi sebelum Anda naik.',
        'Gunakan fitur "Bagikan Perjalanan" ke keluarga terdekat agar mereka tahu posisi Anda secara langsung.',
        'Jika terjadi situasi mencurigakan, segera gunakan tombol darurat di aplikasi untuk memanggil bantuan.'
      ],
      tipsEn: [
        'Verify the license plate and driver name with the app details before getting on.',
        'Use the "Share Trip" feature to share your live location with your family.',
        'In case of suspicious situations, immediately press the emergency button in the app to call for help.'
      ]
    },
    {
      id: 2,
      image: 'assets/Jaga kerahasiaan kode OTP.png',
      title: 'Jaga Kerahasiaan Kode OTP',
      titleEn: 'Keep OTP Code Confidential',
      desc: 'Jangan pernah membagikan kode OTP (One-Time Password) Anda kepada siapa pun, termasuk pihak yang mengaku dari Fivgo.',
      descEn: 'Never share your OTP (One-Time Password) with anyone, including those claiming to be from Fivgo.',
      tips: [
        'OTP adalah kunci rahasia untuk masuk ke akun Anda.',
        'Fivgo tidak pernah meminta kode OTP untuk alasan apa pun.',
        'Laporkan segera jika ada aktivitas mencurigakan pada akun Anda.'
      ],
      tipsEn: [
        'OTP is the secret key to log into your account.',
        'Fivgo never asks for your OTP code for any reason.',
        'Report immediately if there is suspicious activity on your account.'
      ]
    },
    {
      id: 3,
      image: 'assets/aktifkan lokasi.png',
      title: 'Aktifkan Lokasi Akurat',
      titleEn: 'Enable Accurate Location',
      desc: 'Aktifkan GPS/Lokasi Anda untuk membantu driver menemukan posisi penjemputan dengan lebih tepat dan cepat.',
      descEn: 'Enable your GPS/Location to help drivers find your pickup location more accurately and quickly.',
      tips: [
        'Pastikan izin lokasi untuk aplikasi Fivgo sudah diaktifkan di pengaturan ponsel.',
        'Gunakan titik jemput yang sesuai dengan keberadaan Anda.',
        'Lokasi yang akurat meminimalkan waktu tunggu Anda di jalan.'
      ],
      tipsEn: [
        'Ensure location permission for Fivgo is enabled in your phone settings.',
        'Use the pickup point that matches your actual location.',
        'Accurate location minimizes your waiting time on the road.'
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    public langService: LanguageService,
    private router: Router,
    private orderService: OrderService
  ) {}

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

          // Get first 4 cards randomly
          this.promotions = mappedPromos.slice(0, 4);
        }
      },
      error: (err) => {
        console.error('Gagal memuat promo di home:', err);
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
    this.isCopied = false;
  }

  openEducation(edu: any) {
    this.selectedEducation = edu;
  }

  copyPromoCode(code: string) {
    navigator.clipboard.writeText(code);
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }

  usePromo(promo: any) {
    this.selectedPromo = null;
    localStorage.setItem('tempPromoCode', promo.code);
    let service = 'motor';
    if (promo.code.toUpperCase().includes('MOBIL')) {
      service = 'mobil';
    }
    this.router.navigate(['/prioritas-kendaraan'], { queryParams: { vehicle: service } });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  get isIndonesian(): boolean {
    return this.langService.getLanguage() === 'id';
  }
}
