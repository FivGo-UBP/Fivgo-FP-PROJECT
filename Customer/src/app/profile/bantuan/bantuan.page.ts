import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { OrderService, OrderHistory } from '../../services/order.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-bantuan',
  templateUrl: './bantuan.page.html',
  styleUrls: ['./bantuan.page.scss'],
  standalone: false,
})
export class BantuanPage implements OnInit {
  user: User | null = null;
  recentTrips: OrderHistory[] = [];
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    public langService: LanguageService,
    private navCtrl: NavController,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });

    // Fetch fresh profile data
    this.authService.getProfile().subscribe({
      error: (err) => console.error('Failed to fetch profile', err)
    });

    this.loadRecentTrips();
  }

  ionViewWillEnter() {
    this.loadRecentTrips();
  }

  loadRecentTrips() {
    this.isLoading = true;
    this.orderService.getHistory().subscribe({
      next: (res) => {
        // Ambil 2 order terakhir
        this.recentTrips = res.data ? res.data.slice(0, 2) : [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load trips history', err);
        this.isLoading = false;
      }
    });
  }

  formatPrice(price: number): string {
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    return 'Rp' + price?.toLocaleString(locale);
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${day} ${month} ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  goBack() {
    this.navCtrl.back();
  }

  goToActivities() {
    this.router.navigate(['/tabs/aktivitas']);
  }

  openTripDetail(trip: OrderHistory) {
    this.router.navigate(['/order-detail', trip.id]);
  }

  async openFaq() {
    const alert = await this.alertController.create({
      header: this.t('bantuan.faq.title'),
      message: `
        <div style="text-align: left; font-size: 14px; line-height: 1.5; color: #1e293b;">
          <p style="margin-bottom: 8px;"><strong>1. Bagaimana cara memesan perjalanan?</strong><br>Buka halaman utama, pilih jenis kendaraan (Motor/Mobil), tentukan lokasi jemput dan tujuan, lalu ketuk "Pesan".</p>
          <p style="margin-bottom: 8px;"><strong>2. Bagaimana metode pembayarannya?</strong><br>Kami mendukung pembayaran tunai dan non-tunai via FivGo Pay.</p>
          <p style="margin-bottom: 0;"><strong>3. Mengapa pesanan saya dibatalkan?</strong><br>Driver mungkin membatalkan pesanan karena kendala di jalan. Saldo Anda akan otomatis kembali jika transaksi menggunakan FivGo Pay.</p>
        </div>
      `,
      buttons: [this.t('alert.ok')]
    });
    await alert.present();
  }

  async openReports() {
    const alert = await this.alertController.create({
      header: this.t('bantuan.reports.title'),
      message: this.langService.getLanguage() === 'id' 
        ? 'Belum ada laporan aktif dalam 90 hari terakhir.' 
        : 'No active reports in the last 90 days.',
      buttons: [this.t('alert.ok')]
    });
    await alert.present();
  }

  sendEmail() {
    const email = 'support@fivgo.com';
    const subject = 'Bantuan FivGo Customer';
    const body = `Halo Tim Dukungan FivGo,

Saya membutuhkan bantuan mengenai...

Detail Akun:
Nama: ${this.user?.name || '-'}
Telepon: ${this.user?.phone || '-'}
Email: ${this.user?.email || '-'}
`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  get isIndonesian(): boolean {
    return this.langService.getLanguage() === 'id';
  }
}
