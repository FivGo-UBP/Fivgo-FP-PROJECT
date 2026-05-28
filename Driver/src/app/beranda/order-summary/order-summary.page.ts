import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService, OrderDetail } from '../../services/order.service';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.page.html',
  styleUrls: ['./order-summary.page.scss'],
  standalone: false,
})
export class OrderSummaryPage implements OnInit {
  orderId: string = '';
  order: OrderDetail | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  
  rating: number = 0;
  review: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) { }

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

  setRating(val: number) {
    this.rating = val;
  }

  goToDetail() {
    this.router.navigate(['/transaction-detail', this.orderId]);
  }

  finish() {
    // In a real app we might submit the rating here
    this.router.navigate(['/tabs/beranda']);
  }

  formatPrice(price: number | null | undefined): string { 
    if (!price) return 'Rp 0'; 
    return 'Rp ' + price.toLocaleString('id-ID'); 
  }
}
