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
  orderId: string = '';
  detail: OrderDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  // Report fields
  isReportModalOpen: boolean = false;
  isSubmittingReport: boolean = false;
  reportForm = { reason: '', description: '' };

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private navCtrl: NavController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadDetail();
    } else {
      this.isLoading = false;
      this.hasError = true;
    }
  }

  loadDetail() {
    this.isLoading = true;
    this.hasError = false;
    this.orderService.getHistoryDetail(this.orderId).subscribe({
      next: (res) => {
        this.detail = res.data;
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

  formatPrice(price: number): string {
    return 'Rp ' + price?.toLocaleString('id-ID');
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return `${datePart}, ${timePart}`;
  }

  getCommission(): number {
    if (!this.detail) return 0;
    return this.detail.final_price * 0.1; // 10% commission as per design
  }

  getIncome(): number {
    if (!this.detail) return 0;
    return this.detail.final_price - this.getCommission();
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
    if (!this.isReportFormValid() || !this.detail?.customer || this.isSubmittingReport) return;
    this.isSubmittingReport = true;

    this.orderService.reportCustomer({
      customer_id: this.detail.customer.id,
      order_id: this.detail.id,
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
}
