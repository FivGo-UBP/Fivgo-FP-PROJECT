import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { OrderService, ActiveOrder } from '../../services/order.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  isOnline: boolean = false;
  mapUrl: SafeResourceUrl | null = null;

  // State orderan masuk
  incomingOrder: ActiveOrder | null = null;
  isOrderModalOpen: boolean = false;
  isAccepting: boolean = false;
  isRejecting: boolean = false;

  private pollingInterval: any = null;
  private locationInterval: any = null;
  private currentLat: number = 0;
  private currentLng: number = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private orderService: OrderService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadMap();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.stopLocationUpdates();
  }

  ionViewWillLeave() {
    // Keep polling running while app is open, stop only on destroy
  }

  async loadMap() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const lat = coordinates.coords.latitude;
      const lon = coordinates.coords.longitude;
      this.currentLat = lat;
      this.currentLng = lon;

      const offset = 0.01;
      const minLon = lon - offset;
      const minLat = lat - offset;
      const maxLon = lon + offset;
      const maxLat = lat + offset;

      const url = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch (error) {
      console.error('Error getting location', error);
      const fallbackUrl = `https://www.openstreetmap.org/export/embed.html?bbox=107.288%2C-6.311%2C107.318%2C-6.291&layer=mapnik`;
      this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fallbackUrl);
    }
  }

  toggleStatus() {
    const newStatus = this.isOnline ? 'offline' : 'online';
    this.orderService.updateDriverStatus(newStatus).subscribe({
      next: () => {
        this.isOnline = !this.isOnline;
        if (this.isOnline) {
          this.startLocationUpdates();
          this.startPollingOrders();
          this.showToast('Anda sekarang AKTIF. Menunggu orderan...', 'success');
        } else {
          this.stopPolling();
          this.stopLocationUpdates();
          this.isOrderModalOpen = false;
          this.incomingOrder = null;
          this.showToast('Anda sekarang TIDAK AKTIF.', 'medium');
        }
      },
      error: (err) => {
        console.error('Error updating status', err);
        // Toggle anyway for demo purposes if backend is unreachable
        this.isOnline = !this.isOnline;
        if (this.isOnline) {
          this.startLocationUpdates();
          this.startPollingOrders();
          this.showToast('Anda sekarang AKTIF. Menunggu orderan...', 'success');
        } else {
          this.stopPolling();
          this.stopLocationUpdates();
          this.isOrderModalOpen = false;
          this.incomingOrder = null;
          this.showToast('Anda sekarang TIDAK AKTIF.', 'medium');
        }
      }
    });
  }

  // ─── Location Updates ────────────────────────────────────────────────────

  startLocationUpdates() {
    this.sendCurrentLocation();
    this.locationInterval = setInterval(() => {
      this.sendCurrentLocation();
    }, 10000); // Setiap 10 detik
  }

  stopLocationUpdates() {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  async sendCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.currentLat = coordinates.coords.latitude;
      this.currentLng = coordinates.coords.longitude;
      this.orderService.updateDriverLocation(this.currentLat, this.currentLng).subscribe();
    } catch (error) {
      console.error('Error getting location for update', error);
    }
  }

  // ─── Order Polling ───────────────────────────────────────────────────────

  startPollingOrders() {
    this.checkForOrders();
    this.pollingInterval = setInterval(() => {
      this.checkForOrders();
    }, 5000); // Polling setiap 5 detik
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  checkForOrders() {
    // Jika sudah ada modal order, jangan polling lagi
    if (this.isOrderModalOpen) return;

    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        if (order && order.status === 'pending' && !this.isOrderModalOpen) {
          this.incomingOrder = order;
          this.isOrderModalOpen = true;
        }
      },
      error: (err) => {
        console.error('Error polling orders', err);
      }
    });
  }

  // ─── Order Actions ───────────────────────────────────────────────────────

  acceptOrder() {
    if (!this.incomingOrder || this.isAccepting) return;
    this.isAccepting = true;

    this.orderService.acceptOrder(this.incomingOrder.id).subscribe({
      next: () => {
        const orderId = this.incomingOrder!.id;
        this.isOrderModalOpen = false;
        this.isAccepting = false;
        this.stopPolling();
        // Navigasi ke halaman order aktif
        setTimeout(() => {
          this.incomingOrder = null;
          this.router.navigate(['/active-order', orderId]);
        }, 300);
      },
      error: (err) => {
        console.error('Error accepting order', err);
        this.isAccepting = false;
        this.showToast('Gagal menerima order. Coba lagi.', 'danger');
      }
    });
  }

  rejectOrder() {
    if (!this.incomingOrder || this.isRejecting) return;
    this.isRejecting = true;

    this.orderService.rejectOrder(this.incomingOrder.id).subscribe({
      next: () => {
        this.isOrderModalOpen = false;
        this.isRejecting = false;
        this.incomingOrder = null;
        this.showToast('Order ditolak.', 'medium');
      },
      error: (err) => {
        console.error('Error rejecting order', err);
        // Dismiss modal anyway
        this.isOrderModalOpen = false;
        this.isRejecting = false;
        this.incomingOrder = null;
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getCustomerPhoto(): string {
    return this.incomingOrder?.customer?.photo || 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }

  getCustomerName(): string {
    return this.incomingOrder?.customer?.name || 'Pelanggan';
  }

  getCustomerRating(): string {
    const r = this.incomingOrder?.customer?.rating;
    return r ? r.toFixed(1) : '4.8';
  }

  formatPrice(price: number): string {
    return 'Rp ' + price?.toLocaleString('id-ID');
  }

  getDriverIncome(): number {
    const price = this.incomingOrder?.estimated_price || 0;
    return Math.round(price * 0.9); // 90% setelah komisi 10%
  }

  getPaymentLabel(): string {
    const method = this.incomingOrder?.payment_method || 'tunai';
    if (method === 'tunai') return 'Tunai';
    return `Non Tunai : ${method}`;
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
