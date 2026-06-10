import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService, OrderDetail } from '../../services/order.service';

import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.page.html',
  styleUrls: ['./transaction-detail.page.scss'],
  standalone: false,
})
export class TransactionDetailPage implements OnInit {
  orderId: string = '';
  order: OrderDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private navCtrl: NavController
  ) { }

  goBack() {
    this.navCtrl.navigateBack('/tabs/beranda');
  }

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (this.orderId) {
      this.loadOrderDetail();
    } else {
      this.isLoading = false;
      this.hasError = true;
    }
  }

  loadOrderDetail() {
    this.isLoading = true;
    this.orderService.getHistoryDetail(this.orderId).subscribe({
      next: (res) => {
        this.order = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  formatPrice(price: number | null | undefined): string { 
    if (!price) return 'Rp 0'; 
    return 'Rp ' + price.toLocaleString('id-ID'); 
  }
}
