import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { OrderService, ActiveOrder, OrderDetail, OrderHistory } from '../../services/order.service';

@Component({
  selector: 'app-rating-driver',
  templateUrl: './rating-driver.page.html',
  styleUrls: ['./rating-driver.page.scss'],
  standalone: false,
})
export class RatingDriverPage implements OnInit {
  orderId: string | null = null;
  driverName: string = '';
  driverPhoto: string = 'assets/Profile-Default.jpeg'; // fallback
  vehicleInfo: string = '';
  orderDate: string = '';

  // Rating State
  currentRating: number = 0;
  reviewText: string = '';
  isSubmitting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private orderService: OrderService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['order_id']) {
        this.orderId = params['order_id'];
        this.loadOrderDetails();
      }
    });

    // Format current date if we don't have order date yet
    const now = new Date();
    this.orderDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + 
                     now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  loadOrderDetails() {
    if (!this.orderId) return;

    // Fetch order detail from history since it's already completed
    this.orderService.getHistoryDetail(this.orderId).subscribe({
      next: (res) => {
        const order = res.data;
        if (order) {
          if (order.driver) {
            this.driverName = order.driver.name || 'Driver';
            if (order.driver.photo) {
              this.driverPhoto = order.driver.photo;
            }
            
            const vType = order.driver.vehicle_type ? (order.driver.vehicle_type.charAt(0).toUpperCase() + order.driver.vehicle_type.slice(1)) : 'Kendaraan';
            const plate = order.driver.plate_number || '-';
            this.vehicleInfo = `${vType} \u2022 ${plate}`;
          }
          
          if (order.created_at) {
             const d = new Date(order.created_at);
             this.orderDate = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + 
                              d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          }
        }
      },
      error: (err) => {
        console.error('Error fetching order detail for rating:', err);
      }
    });
  }

  setRating(val: number) {
    this.currentRating = val;
  }

  async submitRating() {
    if (this.currentRating === 0) {
      const toast = await this.toastCtrl.create({
        message: 'Mohon berikan penilaian bintang terlebih dahulu.',
        duration: 2000,
        color: 'warning'
      });
      toast.present();
      return;
    }

    if (!this.orderId) return;

    this.isSubmitting = true;
    this.orderService.rateOrder(this.orderId, this.currentRating, this.reviewText).subscribe({
      next: async (res) => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'Terima kasih atas penilaian Anda!',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        
        // Return to home
        this.navCtrl.navigateRoot('/tabs/beranda');
      },
      error: async (err) => {
        this.isSubmitting = false;
        const toast = await this.toastCtrl.create({
          message: 'Gagal mengirim penilaian.',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }
}
