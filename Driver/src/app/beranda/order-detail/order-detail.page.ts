import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
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

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private navCtrl: NavController
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
    this.navCtrl.back();
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
}
