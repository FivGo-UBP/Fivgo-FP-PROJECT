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
    this.navCtrl.navigateBack('/menu-profile');
  }

  goToActivities() {
    this.router.navigate(['/tabs/aktivitas']);
  }

  openTripDetail(trip: OrderHistory) {
    this.navCtrl.navigateForward(`/chatbot-bantuan`, {
      queryParams: { order_id: trip.id }
    });
  }

  openFaq() {
    this.navCtrl.navigateForward('/faq');
  }

  openReports() {
    this.navCtrl.navigateForward('/laporan-masalah');
  }

  sendEmail() {
    const email = 'support@fivgo.com';
    const subject = 'Bantuan FivGo Driver';
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
