import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { OrderService, ActiveOrder } from '../../services/order.service';
import { ToastController, AlertController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

declare var mapboxgl: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  isOnline: boolean = false;
  mapUrl: SafeResourceUrl | null = null;
  private map: any = null;
  private driverMarker: any = null;

  // State orderan masuk
  incomingOrder: ActiveOrder | null = null;
  isOrderModalOpen: boolean = false;
  isAccepting: boolean = false;
  isRejecting: boolean = false;

  // Countdown Timer
  countdownValue: number = 30;
  private countdownInterval: any = null;

  private pollingInterval: any = null;
  private locationInterval: any = null;
  private currentLat: number = 0;
  private currentLng: number = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('[DriverDebug] ngOnInit called');
    this.loadMap();
    this.syncDriverStatus();
  }

  ionViewWillEnter() {
    console.log('[DriverDebug] ionViewWillEnter called');
    // Bersihkan interval & state lama (mencegah kebocoran timer / modal nyangkut dari sesi sebelumnya)
    this.stopPolling();
    this.stopLocationUpdates();
    this.stopCountdown();
    this.isOrderModalOpen = false;
    this.incomingOrder = null;
    this.isAccepting = false;
    this.isRejecting = false;

    this.syncDriverStatus();
  }

  ionViewDidEnter() {
    if (this.map) {
      setTimeout(() => {
        this.map.resize();
      }, 200);
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    this.stopLocationUpdates();
    this.stopCountdown();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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

      this.initMapbox(lat, lon);
    } catch (error) {
      console.error('Error getting location', error);
      this.initMapbox(-6.301, 107.303);
    }
  }

  initMapbox(lat: number, lon: number) {
    if (typeof mapboxgl === 'undefined') {
      setTimeout(() => this.initMapbox(lat, lon), 500);
      return;
    }

    const container = document.getElementById('driver-home-map');
    if (!container) return;

    mapboxgl.accessToken = environment.mapboxApiKey;
    this.map = new mapboxgl.Map({
      container: 'driver-home-map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lon, lat],
      zoom: 15
    });

    this.map.on('load', () => {
      setTimeout(() => {
        if (this.map) this.map.resize();
      }, 100);

      // Ambil tipe kendaraan driver untuk marker yang sesuai
      const userStr = localStorage.getItem('user');
      let vehicleType = 'motor';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          vehicleType = user?.driver_profile?.vehicle_type || 'motor';
        } catch (e) {}
      }

      const vehicleImg = vehicleType === 'mobil' ? 'assets/mobil driver.png' : 'assets/Motor driver.png';

      // Buat elemen penanda kustom untuk driver
      const el = document.createElement('div');
      el.className = 'driver-home-marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = `<img src="${vehicleImg}" alt="driver" style="width:100%;height:100%;object-fit:contain;" />`;

      this.driverMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lon, lat])
        .addTo(this.map);
    });

    setTimeout(() => {
      if (this.map) this.map.resize();
    }, 500);
  }

  syncDriverStatus() {
    console.log('[DriverDebug] syncDriverStatus called');
    // 1. Coba baca status awal dari localStorage agar instan
    const userStr = localStorage.getItem('user');
    console.log('[DriverDebug] LocalStorage user string:', userStr);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('[DriverDebug] LocalStorage parsed user status:', user?.driver_profile?.status);
        if (user?.driver_profile?.status === 'online') {
          this.isOnline = true;
          this.startLocationUpdates();
          this.startPollingOrders();
        }
      } catch (e) {
        console.error('[DriverDebug] Error parsing user from localStorage', e);
      }
    }

    // 2. Fetch data terbaru dari server untuk sinkronisasi jika ada perbedaan
    console.log('[DriverDebug] Fetching latest driver profile from server...');
    this.authService.getProfile().subscribe({
      next: (user) => {
        const status = user?.driver_profile?.status;
        const shouldBeOnline = status === 'online';
        console.log('[DriverDebug] Server profile fetched. Status:', status, 'Should be online:', shouldBeOnline);
        
        // Selalu update state isOnline sesuai server
        this.isOnline = shouldBeOnline;
        
        if (this.isOnline) {
          console.log('[DriverDebug] Driver is ONLINE, ensuring location and polling intervals are active');
          this.startLocationUpdates();
          this.startPollingOrders();
        } else {
          console.log('[DriverDebug] Driver is OFFLINE, stopping location and polling intervals');
          this.stopPolling();
          this.stopLocationUpdates();
          this.isOrderModalOpen = false;
          this.incomingOrder = null;
        }
      },
      error: (err) => {
        console.error('[DriverDebug] Error fetching driver profile for status sync', err);
      }
    });
  }

  updateLocalUserStatus(status: string) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.driver_profile) {
          user.driver_profile.status = status;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (e) {
        console.error('Error updating local user status', e);
      }
    }
  }

  toggleStatus() {
    const newStatus = this.isOnline ? 'offline' : 'online';
    this.orderService.updateDriverStatus(newStatus).subscribe({
      next: () => {
        this.isOnline = !this.isOnline;
        this.updateLocalUserStatus(newStatus);
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
        this.updateLocalUserStatus(this.isOnline ? 'online' : 'offline');
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
    console.log('[DriverDebug] startLocationUpdates called. current locationInterval status:', this.locationInterval ? 'active' : 'inactive');
    if (this.locationInterval) return; // Mencegah duplikasi interval
    this.sendCurrentLocation();
    this.locationInterval = setInterval(() => {
      this.sendCurrentLocation();
    }, 10000); // Setiap 10 detik
  }

  stopLocationUpdates() {
    console.log('[DriverDebug] stopLocationUpdates called');
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  async sendCurrentLocation() {
    console.log('[DriverDebug] sendCurrentLocation executing...');
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.currentLat = coordinates.coords.latitude;
      this.currentLng = coordinates.coords.longitude;
      console.log('[DriverDebug] Current coordinates obtained:', this.currentLat, this.currentLng);
      
      this.orderService.updateDriverLocation(this.currentLat, this.currentLng).subscribe({
        next: () => console.log('[DriverDebug] Location successfully sent to backend'),
        error: (err) => console.error('[DriverDebug] Error sending location to backend', err)
      });

      if (this.map) {
        this.map.easeTo({
          center: [this.currentLng, this.currentLat],
          duration: 1000
        });
      }
      if (this.driverMarker) {
        this.driverMarker.setLngLat([this.currentLng, this.currentLat]);
      }
    } catch (error) {
      console.error('[DriverDebug] Error getting location for update', error);
    }
  }

  // ─── Order Polling ───────────────────────────────────────────────────────

  startPollingOrders() {
    console.log('[DriverDebug] startPollingOrders called. current pollingInterval status:', this.pollingInterval ? 'active' : 'inactive');
    if (this.pollingInterval) return; // Mencegah duplikasi interval
    this.checkForOrders();
    this.pollingInterval = setInterval(() => {
      this.checkForOrders();
    }, 5000); // Polling setiap 5 detik
  }

  stopPolling() {
    console.log('[DriverDebug] stopPolling called');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  checkForOrders() {
    console.log('[DriverDebug] checkForOrders executing...');
    // Jika sudah ada modal order, jangan polling lagi
    if (this.isOrderModalOpen) {
      console.log('[DriverDebug] checkForOrders skipped because isOrderModalOpen is true');
      return;
    }

    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        console.log('[DriverDebug] getActiveOrder response:', order);
        if (order) {
          if (order.status === 'pending' && !this.isOrderModalOpen) {
            console.log('[DriverDebug] New pending order found! Opening modal:', order);
            this.incomingOrder = order;
            this.isOrderModalOpen = true;
            this.startCountdown();
          } else if (['accepted', 'arrived', 'started'].includes(order.status)) {
            console.log(`[DriverDebug] Active order with status '${order.status}' found. Navigating to active-order...`);
            this.stopPolling();
            this.router.navigate(['/active-order', order.id]);
          } else {
            console.log('[DriverDebug] Active order has status:', order.status, '- skipping popup');
          }
        } else {
          console.log('[DriverDebug] No active order returned from server');
        }
      },
      error: (err) => {
        console.error('[DriverDebug] Error polling orders', err);
      }
    });
  }

  // ─── Order Actions ───────────────────────────────────────────────────────

  acceptOrder() {
    if (!this.incomingOrder || this.isAccepting) return;
    this.isAccepting = true;
    this.stopCountdown();

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
    this.stopCountdown();

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

  // ─── Countdown Timer Actions ─────────────────────────────────────────────

  startCountdown() {
    console.log('[DriverDebug] startCountdown called');
    this.stopCountdown();
    this.countdownValue = 30;
    
    this.countdownInterval = setInterval(() => {
      this.countdownValue--;
      console.log('[DriverDebug] Countdown tick:', this.countdownValue);
      
      if (this.countdownValue <= 0) {
        console.log('[DriverDebug] Countdown finished! Automatically rejecting order...');
        this.stopCountdown();
        this.rejectOrder();
      }
    }, 1000);
  }

  stopCountdown() {
    console.log('[DriverDebug] stopCountdown called');
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
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
    return `Non Tunai : ${this.formatPaymentMethod(method)}`;
  }

  formatPaymentMethod(method: string): string {
    const map: Record<string, string> = {
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
      dana: 'DANA',
      ovo: 'OVO',
      gopay: 'GoPay',
      shopeepay: 'ShopeePay',
      linkaja: 'LinkAja',
    };

    return map[method.toLowerCase()] || method;
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
