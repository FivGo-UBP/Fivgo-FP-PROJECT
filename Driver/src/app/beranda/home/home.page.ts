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
  private isInitializingOffline: boolean = false;

  // State orderan masuk
  incomingOrder: ActiveOrder | null = null;
  isOrderModalOpen: boolean = false;
  isAccepting: boolean = false;
  isRejecting: boolean = false;
  profileImage: string = 'assets/Profile-Default.jpeg';

  // Countdown Timer
  countdownValue: number = 30;
  maxCountdownValue: number = 30;
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
    this.checkForActiveOrderOnStartup();

    this.authService.currentUser.subscribe(user => {
      this.profileImage = user?.photo || 'assets/Profile-Default.jpeg';
    });
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
    this.checkForActiveOrderOnStartup();
  }

  ionViewDidEnter() {
    if (this.map) {
      setTimeout(() => { if (this.map) this.map.resize(); }, 100);
      setTimeout(() => { if (this.map) this.map.resize(); }, 300);
      setTimeout(() => { if (this.map) this.map.resize(); }, 500);
    }
  }

  ionViewWillLeave() {
    console.log('[DriverDebug] ionViewWillLeave called. Stopping all background intervals and updates.');
    this.stopPolling();
    this.stopLocationUpdates();
    this.stopCountdown();
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

  async loadMap() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({ timeout: 3000, enableHighAccuracy: true });
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
      setTimeout(() => { if (this.map) this.map.resize(); }, 100);
      setTimeout(() => { if (this.map) this.map.resize(); }, 300);
      setTimeout(() => { if (this.map) this.map.resize(); }, 500);

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

    setTimeout(() => { if (this.map) this.map.resize(); }, 600);
    setTimeout(() => { if (this.map) this.map.resize(); }, 1000);
  }

  checkForActiveOrderOnStartup() {
    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        if (order && ['accepted', 'arrived', 'started'].includes(order.status)) {
          console.log(`[DriverDebug] Active order on startup found: ${order.status}. Redirecting...`);
          this.router.navigate(['/active-order', order.id]);
        }
      },
      error: (err) => console.error('[DriverDebug] Error checking active order on startup', err)
    });
  }

  syncDriverStatus() {
    console.log('[DriverDebug] syncDriverStatus called');
    
    // Periksa jika ini adalah inisialisasi awal sesi aplikasi
    const isSessionInitialized = this.authService.isSessionInitialized;
    if (!isSessionInitialized) {
      console.log('[DriverDebug] First session initialization. Forcing status to offline.');
      this.authService.isSessionInitialized = true;
      this.isInitializingOffline = true;
      this.isOnline = false;
      this.updateLocalUserStatus('offline');
      this.stopPolling();
      this.stopLocationUpdates();
      this.isOrderModalOpen = false;
      this.incomingOrder = null;
      
      // Update status ke offline di server
      this.orderService.updateDriverStatus('offline').subscribe({
        next: () => {
          console.log('[DriverDebug] Driver status forced to offline on server');
          this.isInitializingOffline = false;
        },
        error: (err) => {
          console.error('[DriverDebug] Error forcing offline status on server', err);
          this.isInitializingOffline = false;
        }
      });
      return;
    }
    
    if (this.isInitializingOffline) {
      console.log('[DriverDebug] Skipping sync because offline initialization is in progress');
      return;
    }

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
    console.log('[DriverDebug] toggleStatus clicked. Current isOnline status:', this.isOnline);
    const newStatus = this.isOnline ? 'offline' : 'online';
    console.log('[DriverDebug] Sending updateDriverStatus request to backend. target status:', newStatus);
    
    this.orderService.updateDriverStatus(newStatus).subscribe({
      next: (res) => {
        console.log('[DriverDebug] updateDriverStatus API success response:', res);
        this.isOnline = !this.isOnline;
        console.log('[DriverDebug] Local isOnline status toggled to:', this.isOnline);
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
        console.error('[DriverDebug] updateDriverStatus API failed with error:', err);
        const errMsg = err?.error?.message || 'Gagal memperbarui status ke server. Silakan coba lagi.';
        this.showToast(errMsg, 'danger');
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

    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        console.log('[DriverDebug] getActiveOrder response:', order);
        if (order) {
          if (order.status === 'pending') {
            if (!this.isOrderModalOpen) {
              console.log('[DriverDebug] New pending order found! Opening modal:', order);
              this.incomingOrder = order;
              this.isOrderModalOpen = true;
              this.startCountdown();
            }
          } else if (['accepted', 'arrived', 'started'].includes(order.status)) {
            console.log(`[DriverDebug] Active order with status '${order.status}' found. Navigating to active-order...`);
            this.stopPolling();
            this.isOrderModalOpen = false;
            this.stopCountdown();
            this.incomingOrder = null;
            this.router.navigate(['/active-order', order.id]);
          } else {
            // Jika status order berubah (misalnya dibatalkan oleh customer/sistem), tutup modal
            if (this.isOrderModalOpen && this.incomingOrder && this.incomingOrder.id === order.id) {
              console.log('[DriverDebug] Order status is no longer pending (cancelled/expired). Closing modal.');
              this.isOrderModalOpen = false;
              this.incomingOrder = null;
              this.stopCountdown();
              this.showToast('Orderan telah dibatalkan oleh pelanggan.', 'medium');
            }
          }
        } else {
          // Jika server mengembalikan null (tidak ada order aktif lagi)
          // tetapi modal orderan masuk driver masih terbuka, berarti orderan tersebut sudah dibatalkan atau kadaluwarsa
          if (this.isOrderModalOpen) {
            console.log('[DriverDebug] No active order returned, but modal is open. Closing modal.');
            this.isOrderModalOpen = false;
            this.incomingOrder = null;
            this.stopCountdown();
            this.showToast('Orderan tidak tersedia lagi.', 'medium');
          }
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
    this.maxCountdownValue = 30;
    this.countdownValue = this.maxCountdownValue;
    
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

  getStrokeDashoffset(): number {
    const circumference = 2 * Math.PI * 21; // ~131.95
    if (!this.maxCountdownValue) return circumference;
    const progress = Math.max(0, Math.min(1, this.countdownValue / this.maxCountdownValue));
    return circumference * (1 - progress);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getCustomerPhoto(): string {
    return this.incomingOrder?.customer?.photo || 'assets/Profile-Default.jpeg';
  }

  getCustomerName(): string {
    return this.incomingOrder?.customer?.name || 'Pelanggan';
  }

  getCustomerRating(): string {
    const r = this.incomingOrder?.customer?.rating;
    if (!r) return '4.8';
    return typeof r === 'number' ? r.toFixed(1) : parseFloat(r as any).toFixed(1);
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
