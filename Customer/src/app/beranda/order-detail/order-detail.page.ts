import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, AlertController } from '@ionic/angular';
import { OrderService, OrderDetail } from '../../services/order.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: false,
})
export class OrderDetailPage implements OnInit {

  order: OrderDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  // Report Modal Properties
  isReportModalOpen: boolean = false;
  isSubmittingReport: boolean = false;
  reportForm = {
    reason: '',
    description: ''
  };

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private orderService: OrderService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDetail(id);
  }

  loadDetail(id: string) {
    this.isLoading = true;
    this.hasError = false;

    this.orderService.getHistoryDetail(id).subscribe({
      next: (res) => {
        this.order = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  goBack() {
    this.navCtrl.navigateBack('/tabs/aktivitas');
  }

  // ─── Report Modal Methods ──────────────────────────────────────────────────
  openReportModal() {
    this.reportForm = { reason: '', description: '' };
    this.isReportModalOpen = true;
  }

  closeReportModal() {
    this.isReportModalOpen = false;
  }

  isReportFormValid(): boolean {
    return this.reportForm.reason.trim().length > 0;
  }

  async submitReport() {
    if (!this.isReportFormValid() || !this.order?.driver || this.isSubmittingReport) return;
    this.isSubmittingReport = true;

    this.orderService.reportDriver({
      driver_id: this.order.driver.id,
      order_id: this.order.id,
      reason: this.reportForm.reason,
      description: this.reportForm.description
    }).subscribe({
      next: async () => {
        this.isSubmittingReport = false;
        this.isReportModalOpen = false;
        
        const alert = await this.alertCtrl.create({
          header: 'Laporan Dikirim',
          message: 'Laporan Anda telah berhasil terkirim ke Admin. Kami akan memproses laporan Anda secepatnya.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        this.isSubmittingReport = false;
        console.error('Submit report failed', err);
        const alert = await this.alertCtrl.create({
          header: 'Gagal',
          message: 'Gagal mengirimkan laporan. Silakan coba kembali nanti.',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    const map: { [k: string]: string } = {
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      rejected: 'Ditolak',
    };
    return map[status] ?? status;
  }

  getVehicleLabel(v: string): string {
    return v?.toLowerCase() === 'mobil' ? 'Mobil' : 'Motor';
  }

  formatPrice(price: number): string {
    if (!price) return 'Rp 0';
    return 'Rp ' + price.toLocaleString('id-ID');
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  formatPayment(method: string): string {
    const map: { [k: string]: string } = {
      cash: 'Tunai',
      tunai: 'Tunai',
      dana: 'DANA',
      gopay: 'GoPay',
      ovo: 'OVO',
      qris: 'QRIS',
      bca: 'VA BCA',
      bni: 'VA BNI',
      bri: 'VA BRI',
      mandiri: 'VA Mandiri',
      permata: 'VA Permata',
      cimb: 'VA CIMB',
      danamon: 'VA Danamon',
      va_bca: 'VA BCA',
      va_bni: 'VA BNI',
      va_bri: 'VA BRI',
      va_mandiri: 'VA Mandiri',
      va_permata: 'VA Permata',
      va_cimb: 'VA CIMB',
      va_danamon: 'VA Danamon',
      shopeepay: 'ShopeePay',
      linkaja: 'LinkAja',
    };
    return map[method?.toLowerCase()] ?? method?.toUpperCase() ?? '-';
  }

  getInvoiceNumber(id: string, dateStr: string): string {
    const d = new Date(dateStr);
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const short = id.substring(0, 3).toUpperCase();
    return `INV/${year}/${month}/FGO-${short}`;
  }

  getStarArray(rating: number | null): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= (rating ?? 0));
  }
}
