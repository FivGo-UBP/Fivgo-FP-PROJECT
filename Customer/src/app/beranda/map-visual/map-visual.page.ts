import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
declare var mapboxgl: any;
import { environment } from '../../../environments/environment';
import { TomtomService } from '../../services/tomtom.service';
import { OrderService, ActiveOrder, PaymentRecord } from '../../services/order.service';
import { ToastController, NavController } from '@ionic/angular';
import { Geolocation } from '@capacitor/geolocation';
import { AuthService } from '../../services/auth.service';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
@Component({
  selector: 'app-map-visual',
  templateUrl: './map-visual.page.html',
  styleUrls: ['./map-visual.page.scss'],
  standalone: false,
})
export class MapVisualPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: false }) mapContainer!: ElementRef;
  map!: any;
  
  startCoord = [106.827153, -6.175392];
  destCoord = [106.782006, -6.195325];

  jemput: string = '';
  tujuan: string = '';
  vehicle: string = '';
  isPageActive: boolean = false;
  isVehicleModalOpen: boolean = false;
  isNoteModalOpen: boolean = false;
  driverNote: string = '';

  // ─── State Promo ──────────────────────────────────────────────────────────
  isPromoModalOpen: boolean = false;
  isPromoDetailOpen: boolean = false;
  availablePromos: any[] = [];
  selectedPromo: any | null = null;
  detailPromo: any | null = null;
  manualPromoCode: string = '';
  isApplyingPromo: boolean = false;
  isDraggingPromo: boolean = false;
  promoY: number = 0;

  // ─── State Modal Batal ────────────────────────────────────────────────────
  isCancelReasonModalOpen: boolean = false;
  isCancelSuccessOpen: boolean = false;
  cancelFee: number = 0;
  cancelReasons: string[] = [
    'Ganti lokasi penjemputan/tujuan',
    'Driver tidak merespon chat/telpon',
    'Waktu tunggu terlalu lama',
    'Driver meminta pembatalan.',
    'Posisi driver tidak bergerak',
    'Sudah dapat transportasi lain.',
    'Alasan Lainnya'
  ];
  selectedCancelReason: string = '';
  isDriverCloseForPenalty: boolean = false;

  // Metode pembayaran
  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'qris';
  paymentInfo: PaymentRecord | null = null;
  isCreatingPayment: boolean = false;
  paymentError: string = '';
  isPaymentGatewayOpen: boolean = false;
  dompetxGatewayMethod: string = 'qris';
  dompetxGatewayAmount: number = 0;
  readonly virtualAccountMinAmount = 15000;
  readonly dompetxGatewayOptions = [
    { label: 'QRIS', code: 'qris' },
    { label: 'VA BCA', code: 'bca' },
    { label: 'VA BNI', code: 'bni' },
    { label: 'VA BRI', code: 'bri' },
    { label: 'VA Mandiri', code: 'mandiri' },
    { label: 'VA Permata', code: 'permata' },
    { label: 'VA CIMB', code: 'cimb' },
    { label: 'VA Danamon', code: 'danamon' },
  ];
  private paymentPollingInterval: any = null;

  // ─── State Pencarian Driver ───────────────────────────────────────────────
  isSearchingDriver: boolean = false;
  isDriverNotFound: boolean = false;
  searchProgress: number = 0;
  private searchTimer: any = null;
  private searchDuration: number = 50;
  private searchElapsed: number = 0;
  private isNavigatingAway: boolean = false;

  // ─── Active Order State (setelah order dibuat) ────────────────────────────
  currentOrderId: string | null = null;
  activeOrder: ActiveOrder | null = null;
  isDriverFound: boolean = false;

  private echo: Echo<any> | null = null;
  private currentSubscribedOrderId: string | null = null;
  isDriverArrived: boolean = false;
  isInJourney: boolean = false;
  isOrderComplete: boolean = false;
  showInitialSuccessBanner: boolean = false;
  isCheckingHistory: boolean = false;
  private orderPollingInterval: any = null;
  
  driverEtaText: string = 'Menghitung...';
  tripDistanceKm: number = 0;
  lastUserLngLat: number[] | null = null;
  isMapPanned: boolean = false;
  private driverMarker: any = null;
  private driverAnimationId: any = null;
  private pickupMarker: any = null;
  private dropoffMarker: any = null;

  vehicles = [
    { type: 'motor', name: 'Motor', time: '', capacity: 1, price: '', image: 'assets/motor.png', isLoading: true },
    { type: 'mobil', name: 'Mobil', time: '', capacity: 4, price: '', image: 'assets/mobil.png', isLoading: true }
  ];
  selectedVehicle: string = 'motor';

  // ─── Dragging State for Bottom Sheet ──────────────────────────────────────
  @ViewChild('sheetContent', { static: false }) sheetContentEl!: ElementRef;
  isDragging: boolean = false;
  startY: number = 0;
  currentY: number = 100; // 100% down (HIDDEN, for initial slide-up)
  startTranslateY: number = 100;
  backdropOpacity: number = 0;
  contentOverflowY: string = 'hidden';

  // ─── Dragging State for Note Modal ────────────────────────────────────────
  isDraggingNote: boolean = false;
  noteY: number = 0;
  noteStartY: number = 0;
  noteStartTranslateY: number = 0;

  // ─── Dragging State for Promo Modal ───────────────────────────────────────
  promoStartY: number = 0;
  promoStartTranslateY: number = 0;

  readonly COLLAPSED = 0;
  readonly HALF = 0;
  readonly FULL = 0;


  constructor(
    private tomtomService: TomtomService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private zone: NgZone
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let isGpsFailed = false;

      if (params['jLat'] && params['jLng']) {
        const jLng = parseFloat(params['jLng']);
        const jLat = parseFloat(params['jLat']);
        if (jLng === 0 || jLat === 0 || isNaN(jLng) || isNaN(jLat)) {
          isGpsFailed = true;
        } else {
          this.startCoord = [jLng, jLat];
        }
      }
      if (params['tLat'] && params['tLng']) {
        const tLng = parseFloat(params['tLng']);
        const tLat = parseFloat(params['tLat']);
        if (tLng === 0 || tLat === 0 || isNaN(tLng) || isNaN(tLat)) {
          isGpsFailed = true;
        } else {
          this.destCoord = [tLng, tLat];
        }
      }
      if (params['jemput']) this.jemput = params['jemput'];
      if (params['tujuan']) this.tujuan = params['tujuan'];
      if (params['vehicle']) {
        this.vehicle = params['vehicle'];
        this.selectedVehicle = this.vehicle;
        this.sortVehicles();
      }

      if (isGpsFailed) {
        this.showToast('Gagal mendeteksi lokasi GPS Anda. Pastikan Izin Lokasi aktif lalu cari kembali.', 'danger');
        setTimeout(() => {
          this.navCtrl.back();
        }, 1500);
      }
    });
  }

  ngOnDestroy() {
    this.stopPaymentPolling();
    this.stopOrderPolling();
    this.stopSearch();
    this.stopWatchingUserLocation();
    this.disconnectTrackingWebsocket();
    this.clearDriverMarker();
  }

  connectTrackingWebsocket(orderId: string) {
    if (this.echo && this.currentSubscribedOrderId === orderId) return;

    this.disconnectTrackingWebsocket();
    this.currentSubscribedOrderId = orderId;

    const token = this.authService.getToken();
    if (!token) return;

    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: (environment.reverb as any).broadcaster || 'reverb',
      key: environment.reverb.key,
      cluster: (environment.reverb as any).cluster || undefined,
      wsHost: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.host,
      wsPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
      wssPort: (environment.reverb as any).broadcaster === 'pusher' ? undefined : environment.reverb.port,
      forceTLS: environment.reverb.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    this.echo.private(`order.${orderId}`)
      .listen('.DriverLocationUpdated', (data: { lat: number, lng: number, heading: number }) => {
        if (!this.activeOrder || !this.activeOrder.driver) return;

        this.zone.run(() => {
          this.activeOrder!.driver!.current_lat = data.lat;
          this.activeOrder!.driver!.current_lng = data.lng;
          this.activeOrder!.driver!.heading = data.heading;
          
          this.updateDriverMapAndETA(this.activeOrder!);
        });
      });
  }

  disconnectTrackingWebsocket() {
    if (this.echo && this.currentSubscribedOrderId) {
      this.echo.leave(`order.${this.currentSubscribedOrderId}`);
      this.echo.disconnect();
    }
    this.echo = null;
    this.currentSubscribedOrderId = null;
  }

  sortVehicles() {
    if (this.vehicle === 'mobil') {
      this.vehicles.sort((a, b) => a.type === 'mobil' ? -1 : 1);
    } else {
      this.vehicles.sort((a, b) => a.type === 'motor' ? -1 : 1);
    }
  }

  private selectPreferredRoute(routes: any[] = []): any | null {
    if (!routes.length) return null;

    return [...routes].sort((a: any, b: any) => {
      const aDistance = a?.summary?.lengthInMeters ?? Number.MAX_SAFE_INTEGER;
      const bDistance = b?.summary?.lengthInMeters ?? Number.MAX_SAFE_INTEGER;
      if (aDistance !== bDistance) return aDistance - bDistance;

      const aTime = a?.summary?.travelTimeInSeconds ?? Number.MAX_SAFE_INTEGER;
      const bTime = b?.summary?.travelTimeInSeconds ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })[0];
  }

  ionViewWillEnter() {
    this.loadSavedPaymentPreference();

    if (this.isNavigatingAway) {
      this.isNavigatingAway = false;
      this.isPageActive = true;
      // Pulihkan tampilan modal saat kembali dari chat
      if (this.activeOrder) {
        if (this.activeOrder.status === 'accepted' || this.activeOrder.status === 'arrived' || this.activeOrder.status === 'started') {
          this.isDriverFound = true;
          if (this.activeOrder.status === 'arrived') this.isDriverArrived = true;
          if (this.activeOrder.status === 'started') {
            this.isDriverArrived = true;
            this.isInJourney = true;
          }
        }
      }
      return;
    }

    this.isPageActive = true;
    
    // Periksa apakah ada pesanan aktif saat halaman dimuat
    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        if (order) {
          if (this.clearPreviousOrderForNewBooking(order)) {
            return;
          }

          this.applyActiveOrderRoute(order);

          if (order.status === 'payment_pending') {
            this.loadSavedPaymentPreference();
            this.activeOrder = order;
            this.currentOrderId = order.id;
            this.dompetxGatewayAmount = (typeof order.estimated_price === 'number') 
              ? Math.max(0, order.estimated_price - (order.discount_amount || 0)) 
              : this.getSelectedVehiclePriceRaw();
            this.isVehicleModalOpen = false;
            this.isPaymentGatewayOpen = true;
            this.cdr.detectChanges();

            this.orderService.getPaymentStatus(order.id).subscribe({
              next: (payment) => {
                const preferredMethod = this.resolveDompetxGatewayMethod();
                const paymentMethod = this.normalizePaymentCode(payment.method || '');

                if ((this.selectedPayment === 'nontunai' || this.selectedPayment === 'wallet') && !this.isPaymentPaid(payment) && paymentMethod !== preferredMethod) {
                  this.dompetxGatewayMethod = preferredMethod;
                  this.createDompetxPayment(order.id, this.dompetxGatewayAmount, preferredMethod);
                  return;
                }

                this.paymentInfo = payment;
                this.dompetxGatewayMethod = paymentMethod || this.dompetxGatewayMethod;
                this.startPaymentPolling();
                this.cdr.detectChanges();
              },
              error: () => {
                const payable = (typeof order.estimated_price === 'number') 
                  ? Math.max(0, order.estimated_price - (order.discount_amount || 0)) 
                  : this.getSelectedVehiclePriceRaw();
                this.openDompetxGateway(order.id, payable);
              }
            });
          } else if (order.status === 'pending') {
            // Cek apakah order pending ini sudah kedaluwarsa (lebih dari 2 menit)
            const orderTime = new Date(order.created_at).getTime();
            const now = new Date().getTime();
            const isStale = (now - orderTime) > 120000; // 2 menit

            if (isStale) {
              // Order lama yang nyangkut, otomatis batalkan
              this.orderService.cancelOrder(order.id, 'Auto cancelled stale order').subscribe();
              if (!this.isVehicleModalOpen) {
                this.currentY = 100;
                this.isVehicleModalOpen = true;
                this.cdr.detectChanges();
                setTimeout(() => {
                  this.setSheetPosition(this.COLLAPSED);
                  this.cdr.detectChanges();
                }, 50);
              }
            } else {
              // Order pending yang masih valid
              this.activeOrder = order;
              this.currentOrderId = order.id;
              this.isVehicleModalOpen = false;
              this.cdr.detectChanges();
              
              this.isSearchingDriver = true;
              this.startProgressTimer();
              this.startOrderPolling();
            }
          } else if (order.status === 'accepted' || order.status === 'arrived' || order.status === 'started') {
            this.activeOrder = order;
            this.currentOrderId = order.id;
            this.isVehicleModalOpen = false;
            this.cdr.detectChanges();

            
            this.isDriverFound = true;
            if (order.status === 'arrived') this.isDriverArrived = true;
            if (order.status === 'started') {
              this.isDriverArrived = true;
              this.isInJourney = true;
            }
            this.connectTrackingWebsocket(order.id);
            if (!this.orderPollingInterval) {
              this.startOrderPolling();
            }
          }
        } else {
          // Modal will be opened in ionViewDidEnter
        }
      },
      error: () => {
        // Modal will be opened in ionViewDidEnter
      }
    });

    this.loadSavedPaymentPreference();

    // Auto apply promo if claimed from home page
    const tempPromoCode = localStorage.getItem('tempPromoCode');
    if (tempPromoCode) {
      this.orderService.getPromos().subscribe({
        next: (res) => {
          if (res && res.data) {
            const promo = res.data.find(p => p.code.toUpperCase() === tempPromoCode.toUpperCase());
            if (promo) {
              this.selectedPromo = promo;
              localStorage.removeItem('tempPromoCode');
              this.cdr.detectChanges();
            }
          }
        }
      });
    }
  }

  ionViewDidEnter() {
    // Memberikan sedikit waktu setelah transisi halaman selesai agar modal tidak crash
    setTimeout(() => {
      if (!this.currentOrderId && !this.isSearchingDriver && !this.isDriverFound) {
        this.currentY = 100;
        this.isVehicleModalOpen = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.setSheetPosition(this.COLLAPSED); // Reset position
          this.cdr.detectChanges();
        }, 50);
      }
    }, 150);


    try {
      this.initMap();
      // Redraw driver tracking when returning to this page if an order is active
      if (this.activeOrder && (this.activeOrder.status === 'accepted' || this.activeOrder.status === 'started' || this.activeOrder.status === 'arrived')) {
        this.updateDriverMapAndETA(this.activeOrder);
      }
    } catch (e: any) {
      alert("System Error Map: " + (e.message || e));
    }
  }

  private clearPreviousOrderForNewBooking(order: ActiveOrder): boolean {
    if (!this.isNewBookingSelection() || this.isSameRouteAsSelection(order)) {
      return false;
    }

    const canCancelPreviousOrder = ['payment_pending', 'pending', 'accepted', 'arrived'].includes(order.status);
    if (!canCancelPreviousOrder) {
      return false;
    }

    this.orderService.cancelOrder(order.id, 'Auto cancelled previous unfinished order').subscribe({
      error: (err) => console.warn('Gagal membatalkan order lama:', err)
    });

    this.resetForNewBooking();
    return true;
  }

  private isNewBookingSelection(): boolean {
    return !!(this.route.snapshot.queryParamMap.get('tLat') && this.route.snapshot.queryParamMap.get('tLng'));
  }

  private isSameRouteAsSelection(order: ActiveOrder): boolean {
    return this.isCoordinateClose(Number(order.pickup_lat), this.startCoord[1])
      && this.isCoordinateClose(Number(order.pickup_lng), this.startCoord[0])
      && this.isCoordinateClose(Number(order.dropoff_lat), this.destCoord[1])
      && this.isCoordinateClose(Number(order.dropoff_lng), this.destCoord[0]);
  }

  private isCoordinateClose(a: number, b: number): boolean {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.00015;
  }

  private resetForNewBooking() {
    this.stopSearch();
    this.stopOrderPolling();
    this.stopPaymentPolling();

    this.currentOrderId = null;
    this.activeOrder = null;
    this.paymentInfo = null;
    this.paymentError = '';
    this.isSearchingDriver = false;
    this.isPaymentGatewayOpen = false;
    this.isDriverNotFound = false;
    this.isDriverFound = false;
    this.isDriverArrived = false;
    this.isInJourney = false;
    this.isOrderComplete = false;
    this.showInitialSuccessBanner = false;
    this.isCheckingHistory = false;
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.driverEtaText = 'Menghitung...';

    this.clearDriverMarker();

    this.isPageActive = true;
    this.currentY = 100;
    this.isVehicleModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.setSheetPosition(this.COLLAPSED);
      this.cdr.detectChanges();
    }, 50);
    this.restorePreOrderRoute();
    this.cdr.detectChanges();
  }

  ionViewWillLeave() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPaymentGatewayOpen = false;

    if (this.isNavigatingAway) {
      // Sembunyikan modal supaya tidak terbawa ke halaman chat
      this.isDriverFound = false;
      this.isDriverArrived = false;
      this.isInJourney = false;
      return; // Jangan stop polling jika hanya ke halaman chat
    }

    this.stopSearch();
    this.stopPaymentPolling();
    this.stopOrderPolling();
  }

  goBack() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPaymentGatewayOpen = false;
    setTimeout(() => {
      this.navCtrl.back();
    }, 300);
  }

  goToMetodePembayaran() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPaymentGatewayOpen = false;
    setTimeout(() => {
      this.navCtrl.navigateForward(['/metode-pembayaran'], {
        queryParams: {
          amount: this.dompetxGatewayAmount || this.getSelectedVehiclePriceRaw()
        }
      });
    }, 300);
  }

  initMap() {
    if (typeof mapboxgl === 'undefined') {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    if (this.map) {
      setTimeout(() => this.map.resize(), 100);
      
      const updateElements = () => {
        if (this.pickupMarker) {
          this.pickupMarker.setLngLat(this.startCoord as any);
        } else {
          this.pickupMarker = this.addMarker(this.startCoord, 'start');
        }
        
        if (this.dropoffMarker) {
          this.dropoffMarker.setLngLat(this.destCoord as any);
        } else {
          this.dropoffMarker = this.addMarker(this.destCoord, 'dest');
        }
        
        this.map.setCenter(this.startCoord as any);
        this.fetchPrices(this.startCoord, this.destCoord);
        this.drawRoute(this.startCoord, this.destCoord);
      };

      if (this.map.isStyleLoaded()) {
        updateElements();
      } else {
        this.map.once('idle', () => updateElements());
      }
      this.startWatchingUserLocation();
      return;
    }

    mapboxgl.accessToken = environment.mapboxApiKey;
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      return;
    }
    
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.startCoord[0], this.startCoord[1]] as any,
      zoom: 12
    });

    this.map.on('dragstart', () => {
      this.isMapPanned = true;
      this.cdr.detectChanges();
    });

    setTimeout(() => { if (this.map) this.map.resize(); }, 100);
    setTimeout(() => { if (this.map) this.map.resize(); }, 300);
    setTimeout(() => { if (this.map) this.map.resize(); }, 500);
    setTimeout(() => { if (this.map) this.map.resize(); }, 800);

    this.map.on('load', () => {
      this.pickupMarker = this.addMarker(this.startCoord, 'start');
      this.dropoffMarker = this.addMarker(this.destCoord, 'dest');
      this.fetchPrices(this.startCoord, this.destCoord);
      this.drawRoute(this.startCoord, this.destCoord);
      setTimeout(() => { if (this.map) this.map.resize(); }, 100);
      setTimeout(() => { if (this.map) this.map.resize(); }, 300);
      this.startWatchingUserLocation();
    });
  }

  addMarker(coord: number[], type: 'start' | 'dest') {
    const el = document.createElement('div');
    el.className = 'marker';

    if (type === 'start') {
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))';
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
          <path fill="#007AFF" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>`;
    } else {
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))';
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
          <path fill="#FF9800" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>`;
    }

    return new mapboxgl.Marker(el)
      .setLngLat([coord[0], coord[1]] as any)
      .addTo(this.map);
  }

  fetchPrices(start: number[], dest: number[]) {
    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], 'motor').subscribe((res: any) => {
      const motor = this.vehicles.find(v => v.type === 'motor');
      if (res.routes && res.routes.length > 0) {
        const routeData = this.selectPreferredRoute(res.routes);
        if (!routeData) return;

        const distanceKm = routeData.summary.lengthInMeters / 1000;
        if (this.selectedVehicle === 'motor') {
          this.tripDistanceKm = distanceKm;
        }
        const travelMinutes = Math.ceil(routeData.summary.travelTimeInSeconds / 60);
        const rawPrice = Math.max(8000, 5000 + (distanceKm * 2000));
        const price = Math.round(rawPrice / 500) * 500;
        if (motor) {
          motor.price = 'Rp' + price.toLocaleString('id-ID');
          motor.time = `${travelMinutes} mnt • ${distanceKm.toFixed(1)} km`;
          motor.isLoading = false;
        }
      } else if (motor) {
        motor.isLoading = false;
        motor.price = 'Error';
      }
    }, err => {
      const motor = this.vehicles.find(v => v.type === 'motor');
      if (motor) { motor.isLoading = false; motor.price = 'Error'; }
    });

    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], 'mobil').subscribe((res: any) => {
      const mobil = this.vehicles.find(v => v.type === 'mobil');
      if (res.routes && res.routes.length > 0) {
        const routeData = this.selectPreferredRoute(res.routes);
        if (!routeData) return;

        const distanceKm = routeData.summary.lengthInMeters / 1000;
        if (this.selectedVehicle === 'mobil') {
          this.tripDistanceKm = distanceKm;
        }
        const travelMinutes = Math.ceil(routeData.summary.travelTimeInSeconds / 60);
        const rawPrice = Math.max(20000, 15000 + (distanceKm * 4000));
        const price = Math.round(rawPrice / 500) * 500;
        if (mobil) {
          mobil.price = 'Rp' + price.toLocaleString('id-ID');
          mobil.time = `${travelMinutes} mnt • ${distanceKm.toFixed(1)} km`;
          mobil.isLoading = false;
        }
      } else if (mobil) {
        mobil.isLoading = false;
        mobil.price = 'Error';
      }
    }, err => {
      const mobil = this.vehicles.find(v => v.type === 'mobil');
      if (mobil) { mobil.isLoading = false; mobil.price = 'Error'; }
    });
  }

  drawRoute(start: number[], dest: number[], shouldFitBounds: boolean = true, routeResponse?: any) {
    if (!this.map || !this.isPageActive) return;

    const renderRoute = (res: any) => {
      if (!this.map || !res.routes || res.routes.length === 0) return;
      
      if (!this.map.isStyleLoaded()) {
        this.map.once('idle', () => this.drawRoute(start, dest, shouldFitBounds, res));
        return;
      }

      if (res.routes && res.routes.length > 0) {
        // Hapus layer/source yang tidak terpakai jika jumlah rute baru berkurang
        const activeRouteCount = res.routes.length;
        for (let i = activeRouteCount; i < 5; i++) {
          if (this.map.getLayer(`route-line-${i}`)) this.map.removeLayer(`route-line-${i}`);
          if (this.map.getSource(`route-${i}`)) this.map.removeSource(`route-${i}`);
        }

        const preferredRoute = this.selectPreferredRoute(res.routes);
        if (!preferredRoute) return;
        
        // Simpan satu rute utama saja
        const mainRoute = [preferredRoute];

        for (let i = mainRoute.length - 1; i >= 0; i--) {
          const routeData = mainRoute[i];
          const routePoints = routeData.legs[0].points;
          const coordinates = routePoints.map((point: any) => [point.longitude, point.latitude]);
          const isMain = i === 0;
          const sourceId = isMain ? 'route-main' : `route-${i}`;
          const layerId = isMain ? 'route-line-main' : `route-line-${i}`;

          const existingSource = this.map.getSource(sourceId);
          if (existingSource) {
            // Update data GeoJSON secara dinamis tanpa menghapus layer (mencegah kedipan)
            existingSource.setData({
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates }
            });
          } else {
            this.map.addSource(sourceId, {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
            });
            this.map.addLayer({
              id: layerId, type: 'line', source: sourceId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': isMain ? '#FF9800' : '#888888', 'line-width': isMain ? 5 : 3, 'line-opacity': isMain ? 1 : 0.6 }
            });
          }
        }

        const routeData = mainRoute[0];
        this.tripDistanceKm = (routeData?.summary?.lengthInMeters || 0) / 1000;
        const routePoints = routeData.legs[0].points;
        const coordinates = routePoints.map((point: any) => [point.longitude, point.latitude]);

        if (shouldFitBounds) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          for (const coord of coordinates) bounds.extend(coord as any);
          
          // Sesuaikan padding bawah berdasarkan tipe sheet (lebih pendek jika driver sudah ditemukan)
          const bottomPadding = (this.isDriverFound || this.isInJourney || this.isSearchingDriver) ? 280 : 500;
          
          this.map.fitBounds(bounds, {
            padding: { top: 120, bottom: bottomPadding, left: 60, right: 60 },
            maxZoom: 16 // Mencegah zoom-in ekstrim jika posisi sangat dekat
          });
        }
      }
    };

    if (routeResponse) {
      renderRoute(routeResponse);
    } else {
      this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], this.selectedVehicle).subscribe(
        res => renderRoute(res),
        err => console.error('Error fetching route from TomTom:', err)
      );
    }
  }

  selectVehicle(type: string) {
    if (this.selectedVehicle === type) return;
    this.selectedVehicle = type;
    this.ensureDropoffMarker();
    this.drawRoute(this.startCoord, this.destCoord);
  }

  updateCharCount(event: any) {
    if (this.driverNote.length > 150) this.driverNote = this.driverNote.substring(0, 150);
  }

  openNoteModal() {
    this.isNoteModalOpen = true;
    this.noteY = 0;
  }

  closeNoteModal() {
    this.isNoteModalOpen = false;
  }

  saveNote() {
    this.closeNoteModal();
  }

  // ─── Promo Methods ─────────────────────────────────────────────────────────

  openPromoModal() {
    if (this.selectedPayment === 'tunai') {
      this.showToast('Ubah metode pembayaran ke Non-Tunai / FivGo Pay untuk menggunakan promo.', 'warning');
      return;
    }
    this.isPromoModalOpen = true;
    this.promoY = 0;
    this.manualPromoCode = '';
    this.fetchPromos();
  }

  closePromoModal() {
    this.isPromoModalOpen = false;
  }

  fetchPromos() {
    this.orderService.getPromos().subscribe({
      next: (res) => {
        this.availablePromos = res.data || [];
      },
      error: (err) => {
        console.error('Gagal mengambil daftar promo:', err);
        this.showToast('Gagal memuat daftar promo', 'danger');
      }
    });
  }

  applyManualPromo() {
    if (!this.manualPromoCode || this.isApplyingPromo) return;

    if (this.selectedPayment === 'tunai') {
      this.showToast('Promo hanya dapat digunakan dengan metode pembayaran non-tunai.', 'warning');
      return;
    }

    this.isApplyingPromo = true;
    const amount = this.getSelectedVehiclePriceRaw();
    const vehicleType = this.selectedVehicle;
    const paymentMethod = this.selectedPayment === 'nontunai' 
      ? this.normalizePaymentCode(this.selectedNonTunai) 
      : (this.selectedPayment === 'wallet' ? 'wallet' : 'tunai');

    this.orderService.applyPromo(this.manualPromoCode.trim(), amount, vehicleType, paymentMethod).subscribe({
      next: (res) => {
        this.isApplyingPromo = false;
        
        // Cari promo di daftar promo lokal
        const found = this.availablePromos.find(p => p.code.toLowerCase() === this.manualPromoCode.trim().toLowerCase() || p.id === res.promo_id);
        if (found) {
          this.selectedPromo = found;
        } else {
          this.selectedPromo = {
            id: res.promo_id,
            code: res.promo_code,
            title: res.promo_code,
            description: 'Promo berhasil diterapkan',
            discount_percent: Math.round((res.discount_amount / amount) * 100),
            max_discount: res.discount_amount,
            min_order_amount: 0,
            applicable_vehicles: [vehicleType]
          };
        }
        
        this.showToast('Promo berhasil diterapkan!', 'success');
        this.closePromoModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isApplyingPromo = false;
        const msg = err?.error?.message || 'Kode promo tidak valid';
        this.showToast(msg, 'danger');
      }
    });
  }

  viewPromoDetail(p: any) {
    this.detailPromo = p;
    this.isPromoDetailOpen = true;
  }

  closePromoDetail() {
    this.isPromoDetailOpen = false;
    this.detailPromo = null;
  }

  getPromoImage(code: string): string {
    const c = (code || '').toUpperCase();
    if (c === 'FIVGOMOTOR10X') {
      return 'assets/promo_10x_motor.png';
    }
    if (c === 'FIVGOMOBILBARU') {
      return 'assets/promo_mobil.png';
    }
    if (c === 'FIVGOMOTORBARU') {
      return 'assets/promo_motor.png';
    }
    return 'assets/beranda poster.png'; // default fallback image
  }

  selectPromo(p: any) {
    if (this.selectedPayment === 'tunai') {
      this.showToast('Promo hanya dapat digunakan dengan metode pembayaran non-tunai.', 'warning');
      return;
    }
    this.selectedPromo = p;
    this.closePromoDetail();
    this.closePromoModal();
    this.showToast(`Promo ${p.code} berhasil digunakan!`, 'success');
    this.cdr.detectChanges();
  }

  copyPromoCode(code: string) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.showToast('Kode promo berhasil disalin', 'success');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Fallback copy
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      this.showToast('Kode promo berhasil disalin', 'success');
    });
  }

  getPromoEligibilityError(p: any): string | null {
    const amount = this.getSelectedVehiclePriceRaw();
    if (amount < (p.min_order_amount || 0)) {
      return `Minimum transaksi Rp ${(p.min_order_amount || 0).toLocaleString('id-ID')}`;
    }
    
    if (p.applicable_vehicles) {
      let vehicles = [];
      try {
        vehicles = typeof p.applicable_vehicles === 'string' ? JSON.parse(p.applicable_vehicles) : p.applicable_vehicles;
      } catch (e) {
        vehicles = [];
      }
      if (Array.isArray(vehicles) && !vehicles.includes(this.selectedVehicle)) {
        return `Hanya berlaku untuk FivGO ${this.getApplicableVehiclesLabel(p.applicable_vehicles)}`;
      }
    }
    
    return null;
  }

  getApplicableVehiclesLabel(vehicles: any): string {
    let list = [];
    try {
      list = typeof vehicles === 'string' ? JSON.parse(vehicles) : vehicles;
    } catch (e) {
      list = [];
    }
    if (!Array.isArray(list)) return '';
    return list.map(v => v === 'motor' ? 'Motor' : 'Mobil').join(' & ');
  }

  getDiscountedPriceRaw(vehicleType: string, originalPriceRaw: number): number {
    if (!this.selectedPromo) return originalPriceRaw;
    const promo = this.selectedPromo;
    
    if (promo.applicable_vehicles) {
      let vehicles = [];
      try {
        vehicles = typeof promo.applicable_vehicles === 'string' ? JSON.parse(promo.applicable_vehicles) : promo.applicable_vehicles;
      } catch (e) {
        vehicles = [];
      }
      if (Array.isArray(vehicles) && !vehicles.includes(vehicleType)) {
        return originalPriceRaw;
      }
    }
    
    if (originalPriceRaw < (promo.min_order_amount || 0)) {
      return originalPriceRaw;
    }
    
    let discount = (originalPriceRaw * (promo.discount_percent || 0)) / 100;
    if (discount > (promo.max_discount || 0)) {
      discount = promo.max_discount;
    }
    return Math.max(0, originalPriceRaw - Math.round(discount));
  }

  getPriceRaw(priceStr: string): number {
    if (!priceStr || priceStr === 'Error' || priceStr === 'Menghitung...') return 0;
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  }

  getSelectedVehiclePrice(): string {
    const v = this.vehicles.find(v => v.type === this.selectedVehicle);
    if (!v || !v.price || v.price === 'Error' || v.price === 'Menghitung...') return 'Menghitung...';
    
    const originalPrice = this.getPriceRaw(v.price);
    const discountedPrice = this.getDiscountedPriceRaw(v.type, originalPrice);
    
    if (discountedPrice !== originalPrice) {
      return 'Rp' + discountedPrice.toLocaleString('id-ID');
    }
    return v.price;
  }

  getSelectedVehiclePriceRaw(): number {
    const v = this.vehicles.find(v => v.type === this.selectedVehicle);
    if (!v || !v.price || v.price === 'Error' || v.price === 'Menghitung...') return 0;
    return parseInt(v.price.replace(/[^0-9]/g, ''), 10);
  }

  handlePromoStart(e: any) {
    this.isDraggingPromo = true;
    this.promoStartY = e.type === 'mousedown' ? e.pageY : e.touches[0].pageY;
    this.promoStartTranslateY = this.promoY;
  }

  isShortDistanceForMobil(): boolean {
    return this.selectedVehicle === 'mobil' && this.tripDistanceKm > 0 && this.tripDistanceKm < 0.5;
  }

  getSelectedPaymentLabel(): string {
    if (this.selectedPayment === 'tunai') return 'Tunai';
    if (this.selectedPayment === 'wallet') return 'FivGo Pay';

    const label = this.getNonTunaiLabel(this.selectedNonTunai);
    const amount = this.getSelectedVehiclePriceRaw();
    if (this.isVirtualAccountMethod(this.selectedNonTunai) && amount > 0 && amount < this.virtualAccountMinAmount) {
      return `${label} (Min Rp15rb)`;
    }

    return label;
  }

  getNonTunaiLabel(code: string): string {
    const labels: Record<string, string> = {
      QRIS: 'QRIS',
      qris: 'QRIS',
      VA_BCA: 'VA BCA',
      bca: 'VA BCA',
      VA_BNI: 'VA BNI',
      bni: 'VA BNI',
      VA_BRI: 'VA BRI',
      bri: 'VA BRI',
      VA_MANDIRI: 'VA Mandiri',
      mandiri: 'VA Mandiri',
      VA_PERMATA: 'VA Permata',
      permata: 'VA Permata',
      VA_CIMB: 'VA CIMB',
      cimb: 'VA CIMB',
      VA_DANAMON: 'VA Danamon',
      danamon: 'VA Danamon',
      DANA: 'DANA',
      dana: 'DANA',
      OVO: 'OVO',
      ovo: 'OVO',
      GOPAY: 'GoPay',
      gopay: 'GoPay',
      SHOPEEPAY: 'ShopeePay',
      shopeepay: 'ShopeePay',
      LINKAJA: 'LinkAja',
      linkaja: 'LinkAja',
    };

    return labels[code] || code;
  }

  normalizePaymentCode(value: string): string {
    const raw = (value || '').trim();
    if (!raw) return 'qris';

    const normalized = raw.toUpperCase().replace(/[\s-]+/g, '_');
    if (['QRIS', 'QRIS_VA', 'QRIS/VA', 'NON_TUNAI', 'NONTUNAI', 'DOMPETX'].includes(normalized)) {
      return 'qris';
    }

    const aliases: Record<string, string> = {
      DANA: 'dana',
      GOPAY: 'gopay',
      GO_PAY: 'gopay',
      SHOPEEPAY: 'shopeepay',
      SHOPEE_PAY: 'shopeepay',
      LINKAJA: 'linkaja',
      LINK_AJA: 'linkaja',
      VIRTUAL_ACCOUNT: 'bca',
      VA: 'bca',
      VA_BCA: 'bca',
      BCA: 'bca',
      VA_BNI: 'bni',
      BNI: 'bni',
      VA_BRI: 'bri',
      BRI: 'bri',
      VA_MANDIRI: 'mandiri',
      MANDIRI: 'mandiri',
      VA_PERMATA: 'permata',
      PERMATA: 'permata',
      VA_CIMB: 'cimb',
      CIMB: 'cimb',
      VA_DANAMON: 'danamon',
      DANAMON: 'danamon',
    };

    return aliases[normalized] || raw.toLowerCase();
  }

  private loadSavedPaymentPreference() {
    const savedPayment = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');

    if (savedPayment) {
      const normalizedPayment = savedPayment.trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (['nontunai', 'non_tunai', 'qris_va', 'qris/va', 'dompetx'].includes(normalizedPayment)) {
        this.selectedPayment = 'nontunai';
      } else if (normalizedPayment === 'wallet') {
        this.selectedPayment = 'wallet';
      } else {
        this.selectedPayment = 'tunai';
      }
    }

    if (savedNonTunai) {
      this.selectedNonTunai = this.normalizePaymentCode(savedNonTunai);
    }

    if (this.selectedPromo && this.selectedPayment === 'tunai') {
      this.selectedPromo = null;
      this.showToast('Promo dinonaktifkan karena Anda memilih metode pembayaran Tunai.', 'warning');
    }
  }

  getDompetxGatewayMethodLabel(): string {
    return this.getNonTunaiLabel(this.dompetxGatewayMethod);
  }

  getDompetxDetail(): any {
    const payload = this.paymentInfo?.gateway_payload || {};
    const candidates = [
      payload?.detail?.data,
      payload?.detail?.payment,
      payload?.detail?.transaction,
      payload?.detail,
      payload?.data,
      payload?.payment,
      payload?.transaction,
      payload,
    ];

    return candidates.find(candidate => {
      return candidate && (typeof candidate !== 'object' || Object.keys(candidate).length > 0);
    }) || {};
  }

  getPaymentQrImage(): string {
    return this.getDompetxDetail()?.qrData?.qrImage || '';
  }

  getPaymentQrString(): string {
    return this.getDompetxDetail()?.qrData?.qrString || '';
  }

  getPaymentVaNumber(): string {
    const detail = this.getDompetxDetail();
    return detail?.vaData?.va_number
      || detail?.vaData?.vaNumber
      || detail?.vaData?.account_number
      || detail?.vaData?.accountNumber
      || detail?.virtualAccount?.accountNumber
      || detail?.virtualAccount?.number
      || detail?.virtualAccount?.va_number
      || detail?.virtualAccount?.account_number
      || detail?.va_number
      || detail?.vaNumber
      || detail?.account_number
      || detail?.accountNumber
      || '';
  }

  getPaymentVaBankName(): string {
    const detail = this.getDompetxDetail();
    return detail?.vaData?.bank_name
      || detail?.vaData?.bankName
      || detail?.virtualAccount?.bank_name
      || detail?.virtualAccount?.bankName
      || detail?.bank_name
      || detail?.bankName
      || (this.getPaymentVaNumber() ? this.getDompetxGatewayMethodLabel() : '');
  }

  getPaymentReference(): string {
    const detail = this.getDompetxDetail();
    return detail?.qrData?.refId || detail?.refId || detail?.reference || this.paymentInfo?.transaction_id || '-';
  }

  getPaymentStatusLabel(): string {
    const status = (this.paymentInfo?.status || '').toLowerCase();
    if (['paid', 'captured', 'success', 'settled'].includes(status)) return 'Terbayar';
    if (status === 'failed') return 'Gagal';
    if (status === 'cancelled') return 'Dibatalkan';
    return 'Menunggu pembayaran';
  }

  // ─── CARI DRIVER & ORDER FLOW ─────────────────────────────────────────────

  startSearch() {
    this.loadSavedPaymentPreference();

    // Validasi kesesuaian nominal sebelum memproses pesanan ke backend
    const payableAmount = this.getSelectedVehiclePriceRaw();
    const selectedMethod = this.selectedPayment === 'nontunai' 
      ? this.normalizePaymentCode(this.selectedNonTunai) 
      : (this.selectedPayment === 'wallet' ? 'wallet' : 'tunai');
    const amountError = this.getDompetxAmountError(selectedMethod, payableAmount);

    if (amountError) {
      this.showToast(amountError, 'warning');
      this.goToMetodePembayaran();
      return;
    }

    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPageActive = true;
    this.paymentInfo = null;
    this.paymentError = '';
    this.stopPaymentPolling();

    // 1. Buat order di backend
    const orderData = {
      pickup_address: this.jemput,
      pickup_lat: this.startCoord[1],
      pickup_lng: this.startCoord[0],
      dropoff_address: this.tujuan,
      dropoff_lat: this.destCoord[1],
      dropoff_lng: this.destCoord[0],
      payment_method: this.selectedPayment === 'nontunai' 
        ? this.normalizePaymentCode(this.selectedNonTunai) 
        : (this.selectedPayment === 'wallet' ? 'wallet' : 'tunai'),
      vehicle_type: this.selectedVehicle,
      notes: this.driverNote || undefined,
      estimated_price: this.getSelectedVehiclePriceRaw() || undefined,
      promo_code: this.selectedPromo ? this.selectedPromo.code : undefined
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.currentOrderId = order.id;
        if (this.selectedPayment === 'nontunai' || this.selectedPayment === 'wallet') {
          const payable = (typeof order.estimated_price === 'number') 
            ? Math.max(0, order.estimated_price - (order.discount_amount || 0)) 
            : this.getSelectedVehiclePriceRaw();
          this.openDompetxGateway(order.id, payable);
          return;
        }
        this.beginDriverSearch();
      },
      error: (err) => {
        console.error('Gagal membuat order:', err);
        const msg = err?.error?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
        this.showToast(msg, 'danger');
        this.isSearchingDriver = false;
        this.isVehicleModalOpen = true;
      }
    });
  }

  beginDriverSearch() {
    this.isPaymentGatewayOpen = false;
    this.isPageActive = true;
    this.stopPaymentPolling();

    setTimeout(() => {
      this.isSearchingDriver = true;
      this.isDriverNotFound = false;
      this.searchProgress = 0;
      this.searchElapsed = 0;
      this.cdr.detectChanges();
    }, 350);

    if (this.currentOrderId) {
      this.startOrderPolling();
    }

    this.startProgressTimer();
  }

  openDompetxGateway(orderId: string, amount: number) {
    this.loadSavedPaymentPreference();
    this.isPaymentGatewayOpen = true;
    this.isSearchingDriver = false;
    this.isDriverNotFound = false;
    this.paymentInfo = null;
    this.paymentError = '';
    this.dompetxGatewayAmount = amount || this.getSelectedVehiclePriceRaw();
    this.dompetxGatewayMethod = this.resolveDompetxGatewayMethod();
    this.createDompetxPayment(orderId, this.dompetxGatewayAmount, this.dompetxGatewayMethod);
  }

  selectDompetxGatewayMethod(code: string) {
    if (this.dompetxGatewayMethod === code || this.isCreatingPayment || !this.currentOrderId) return;

    this.dompetxGatewayMethod = code;
    this.paymentInfo = null;
    this.paymentError = '';
    this.createDompetxPayment(this.currentOrderId, this.dompetxGatewayAmount || this.getSelectedVehiclePriceRaw(), code);
  }

  private resolveDompetxGatewayMethod(): string {
    if (this.selectedPayment === 'wallet') return 'wallet';
    const preferred = this.normalizePaymentCode(this.selectedNonTunai || this.dompetxGatewayMethod || 'qris');
    return this.dompetxGatewayOptions.some(opt => opt.code === preferred) ? preferred : 'qris';
  }

  createDompetxPayment(orderId: string, amount: number, method: string = this.dompetxGatewayMethod) {
    this.isCreatingPayment = true;
    this.paymentError = '';
    const payableAmount = amount || this.getSelectedVehiclePriceRaw();
    const amountError = this.getDompetxAmountError(method, payableAmount);

    if (amountError) {
      this.paymentError = amountError;
      this.paymentInfo = null;
      this.isCreatingPayment = false;
      this.showToast(amountError, 'warning');
      this.cdr.detectChanges();
      return;
    }

    this.orderService.createPayment({
      order_id: orderId,
      method,
      amount: payableAmount
    }).subscribe({
      next: (payment) => {
        this.paymentInfo = payment;
        this.isCreatingPayment = false;
        if (this.isPaymentPaid(payment)) {
          this.beginDriverSearch();
          return;
        }
        this.startPaymentPolling();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal membuat pembayaran DompetX:', err);
        this.paymentError = this.getDompetxErrorMessage(err);
        this.isCreatingPayment = false;
        this.showToast(this.paymentError, 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  private getDompetxErrorMessage(err: any): string {
    const message = err?.error?.message
      || err?.error?.payment?.gateway_payload?.error
      || 'Pembayaran digital belum bisa dibuat. Coba channel lain atau ganti ke Tunai.';

    return this.formatDompetxErrorMessage(message);
  }

  private formatDompetxErrorMessage(message: string): string {
    const minimumMatch = `${message}`.match(/minimum transaction amount is\s*(\d+)/i);

    if (minimumMatch) {
      const amount = Number(minimumMatch[1]);
      return `Virtual account minimal Rp ${amount.toLocaleString('id-ID')}. Pilih QRIS atau Tunai untuk tarif ini.`;
    }

    return message;
  }

  private getDompetxAmountError(method: string, amount: number): string {
    if (this.isVirtualAccountMethod(method) && amount < this.virtualAccountMinAmount) {
      return `Virtual account minimal Rp ${this.virtualAccountMinAmount.toLocaleString('id-ID')}. Pilih QRIS atau Tunai untuk tarif ini.`;
    }

    return '';
  }

  canSwitchDompetxToQris(): boolean {
    return !!this.currentOrderId && !this.isCreatingPayment && this.isVirtualAccountMethod(this.dompetxGatewayMethod);
  }

  switchDompetxToQris() {
    if (!this.currentOrderId) return;

    this.selectedPayment = 'nontunai';
    this.selectedNonTunai = 'qris';
    this.dompetxGatewayMethod = 'qris';
    localStorage.setItem('selectedPayment', 'nontunai');
    localStorage.setItem('selectedNonTunai', 'qris');
    this.paymentInfo = null;
    this.paymentError = '';
    this.createDompetxPayment(this.currentOrderId, this.dompetxGatewayAmount || this.getSelectedVehiclePriceRaw(), 'qris');
  }

  private isVirtualAccountMethod(method: string): boolean {
    return ['bca', 'bni', 'bri', 'mandiri', 'permata', 'cimb', 'danamon', 'bsi']
      .includes(this.normalizePaymentCode(method));
  }

  checkPaymentAndContinue(showPendingToast: boolean = true) {
    if (!this.currentOrderId) return;

    this.orderService.getPaymentStatus(this.currentOrderId).subscribe({
      next: (payment) => {
        this.paymentInfo = payment;
        if (this.isPaymentPaid(payment)) {
          this.showToast('Pembayaran berhasil. Mencari driver terdekat.', 'success');
          this.beginDriverSearch();
          return;
        }

        if (showPendingToast) {
          this.showToast('Pembayaran belum terdeteksi.', 'warning');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Gagal mengecek status pembayaran:', err);
        if (showPendingToast) {
          this.showToast('Belum bisa mengecek status pembayaran.', 'danger');
        }
      }
    });
  }

  startPaymentPolling() {
    if (this.paymentPollingInterval) return;

    this.paymentPollingInterval = setInterval(() => {
      if (!this.isPaymentGatewayOpen || !this.currentOrderId) {
        this.stopPaymentPolling();
        return;
      }

      this.checkPaymentAndContinue(false);
    }, 5000);
  }

  stopPaymentPolling() {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
  }

  isPaymentPaid(payment: PaymentRecord | null = this.paymentInfo): boolean {
    const status = (payment?.status || '').toLowerCase();
    return ['paid', 'captured', 'success', 'settled'].includes(status);
  }

  startProgressTimer() {
    if (this.searchTimer) return; // Jangan double timer
    this.searchTimer = setInterval(() => {
      this.searchElapsed++;
      // Loop progress bar infinitely (resetting once it reaches 100%)
      this.searchProgress = Math.round((this.searchElapsed / this.searchDuration) * 100) % 101;
      if (this.searchProgress >= 100) {
        this.searchElapsed = 0;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  /** Polling status order untuk mengetahui driver menerima */
  startOrderPolling() {
    if (this.orderPollingInterval) return;

    this.orderPollingInterval = setInterval(() => {
      if (!this.currentOrderId) return;
      this.orderService.getActiveOrder().subscribe({
        next: (order) => {
          if (!order || (this.currentOrderId && order.id !== this.currentOrderId)) {
            if (!this.isCheckingHistory) {
              this.isCheckingHistory = true;
              this.checkMissingOrderStatus();
            }
            return;
          }
          this.isCheckingHistory = false;
          this.activeOrder = order;

          if (order && ['accepted', 'arrived', 'started'].includes(order.status)) {
            this.connectTrackingWebsocket(order.id);
          }

          if (order.status === 'accepted' && !this.isDriverFound) {
            // Driver ditemukan!
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isPageActive = true;
            
            setTimeout(() => {
              this.isDriverFound = true;
              this.showInitialSuccessBanner = true;
              this.cdr.detectChanges();
              setTimeout(() => {
                this.showInitialSuccessBanner = false;
              }, 4000);
            }, 350);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'accepted' && this.isDriverFound) {
            // Driver sedang menuju penjemputan — tracking terus-menerus
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'arrived' && !this.isDriverArrived) {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isPageActive = true;
            this.isDriverFound = true;
            this.isDriverArrived = true;
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'arrived' && this.isDriverArrived) {
            // Driver sudah di titik, tetap update marker posisi
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'started' && !this.isInJourney) {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isPageActive = true;
            this.isDriverFound = true;
            this.isDriverArrived = true;
            this.isInJourney = true;
            // Reset marker agar fitBounds terjadi lagi untuk rute baru (driver → tujuan)
            this.clearDriverMarker();
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'started' && this.isInJourney) {
            // Dalam perjalanan — tracking terus-menerus
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'completed') {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.stopOrderPolling();
            this.isOrderComplete = true;
            this.isNavigatingAway = true; // Prevents polling restart
            
            // Navigate to rating page
            this.router.navigate(['/rating-driver'], { queryParams: { order_id: order.id } });
            
          } else if (order.status === 'rejected') {
            this.stopSearch();
            this.stopOrderPolling();
            this.isSearchingDriver = false;
            this.isDriverNotFound = true;
          } else if (order.status === 'cancelled') {
            this.stopOrderPolling();
            this.showToast('Pesanan dibatalkan.', 'danger');
            this.cancelOrder();
          } else if (order.status === 'pending') {
            if (this.isDriverFound) {
              // Driver membatalkan/melepas pesanan, kembali mencari driver baru
              this.isDriverFound = false;
              this.isDriverArrived = false;
              this.isInJourney = false;
              this.isSearchingDriver = true;
              
              this.clearDriverMarker();
              this.disconnectTrackingWebsocket();
              
              this.showToast('Driver membatalkan pesanan. Mencari driver baru...', 'warning');
              
              // Kembalikan rute awal penjemputan -> tujuan
              this.restorePreOrderRoute();
              if (!this.pickupMarker) {
                this.pickupMarker = this.addMarker(this.startCoord, 'start');
              }
              this.startProgressTimer();
              this.cdr.detectChanges();
            }
          }
        },
        error: (err) => console.error('Error polling order status:', err)
      });
    }, 4000);
  }

  checkMissingOrderStatus() {
    if (!this.currentOrderId) return;
    
    this.orderService.getHistoryDetail(this.currentOrderId).subscribe({
      next: (res) => {
        this.isCheckingHistory = false;
        const order = res.data;
        if (order) {
          if (order.status === 'completed') {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.stopOrderPolling();
            this.isOrderComplete = true;
            this.isNavigatingAway = true;
            
            this.router.navigate(['/rating-driver'], { queryParams: { order_id: order.id } });
          } else if (order.status === 'rejected') {
            this.stopSearch();
            this.stopOrderPolling();
            this.isSearchingDriver = false;
            this.isDriverNotFound = true;
          } else if (order.status === 'cancelled') {
            this.stopOrderPolling();
            this.showToast('Pesanan dibatalkan.', 'danger');
            this.cancelOrder();
          }
        }
      },
      error: (err) => {
        this.isCheckingHistory = false;
        console.error('Error checking missing order status:', err);
      }
    });
  }

  stopOrderPolling() {
    if (this.orderPollingInterval) {
      clearInterval(this.orderPollingInterval);
      this.orderPollingInterval = null;
    }
    this.disconnectTrackingWebsocket();
  }

  stopSearch() {
    if (this.searchTimer) {
      clearInterval(this.searchTimer);
      this.searchTimer = null;
    }
  }

  cancelSearch() {
    this.stopSearch();
    this.stopOrderPolling();
    this.stopPaymentPolling();

    // Batalkan order di backend jika sudah dibuat
    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, 'Customer cancelled search').subscribe();
      this.currentOrderId = null;
    }

    this.isSearchingDriver = false;
    this.isPaymentGatewayOpen = false;
    this.isDriverNotFound = false;
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.isNoteModalOpen = false;

    setTimeout(() => {
      this.currentY = 100;
      this.isVehicleModalOpen = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.setSheetPosition(this.COLLAPSED);
        this.isPageActive = true;
        this.restorePreOrderRoute();
        this.cdr.detectChanges();
      }, 50);
    }, 350);
  }


  retrySearch() {
    if (this.currentOrderId) {
      this.orderService.retryOrder(this.currentOrderId).subscribe({
        next: () => {
          this.isDriverNotFound = false;
          this.activeOrder = null;
          this.beginDriverSearch();
        },
        error: (err) => {
          console.error('Gagal mengulang pencarian driver:', err);
          this.showToast('Gagal mengulang pencarian driver. Silakan pesan ulang.', 'danger');
          this.cancelOrder();
        }
      });
    } else {
      this.isDriverNotFound = false;
      this.activeOrder = null;
      this.currentOrderId = null;
      
      setTimeout(() => {
        this.startSearch();
      }, 350);
    }
  }

  cancelOrder() {
    this.stopSearch();
    this.stopOrderPolling();
    this.stopPaymentPolling();

    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, 'Customer cancelled').subscribe();
      this.currentOrderId = null;
    }

    this.isSearchingDriver = false;
    this.isPaymentGatewayOpen = false;
    this.isDriverNotFound = false;
    this.isDriverFound = false;
    this.isDriverArrived = false;
    this.isInJourney = false;
    this.showInitialSuccessBanner = false;
    this.activeOrder = null;
    this.paymentInfo = null;
    this.paymentError = '';
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.isNoteModalOpen = false;
    
    setTimeout(() => {
      this.currentY = 100;
      this.isVehicleModalOpen = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.setSheetPosition(this.COLLAPSED);
        this.isPageActive = true;
        this.restorePreOrderRoute();
        this.cdr.detectChanges();
      }, 50);
    }, 350);
    
    this.clearDriverMarker();
    this.hideDropoffMarkerUntilJourneyStarts();
  }

  // ─── Modal Alasan Batal ──────────────────────────────────────────────────

  openCancelReasonModal() {
    this.isCancelReasonModalOpen = true;
    this.selectedCancelReason = '';
    
    // Periksa apakah driver dekat (< 1km) atau sudah tiba
    if (this.activeOrder) {
      if (this.activeOrder.status === 'arrived' || this.activeOrder.status === 'started') {
        this.isDriverCloseForPenalty = true;
      } else if (this.activeOrder.driver?.current_lat && this.activeOrder.driver?.current_lng) {
        const dLat = parseFloat(this.activeOrder.driver.current_lat as any);
        const dLng = parseFloat(this.activeOrder.driver.current_lng as any);
        const pLat = this.startCoord[1];
        const pLng = this.startCoord[0];
        
        // Jarak dalam meter
        const distLat = (dLat - pLat) * 111000;
        const distLng = (dLng - pLng) * 111000 * Math.cos(pLat * Math.PI / 180);
        const dist = Math.sqrt(distLat * distLat + distLng * distLng);
        
        this.isDriverCloseForPenalty = dist <= 1000;
      } else {
        this.isDriverCloseForPenalty = false;
      }
    }
  }

  closeCancelReasonModal() {
    this.isCancelReasonModalOpen = false;
    this.selectedCancelReason = '';
  }

  selectCancelReason(reason: string) {
    this.selectedCancelReason = reason;
  }

  confirmCancelOrder() {
    this.isCancelReasonModalOpen = false;
    this.stopSearch();
    this.stopOrderPolling();
    this.stopPaymentPolling();

    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, this.selectedCancelReason || 'Customer cancelled').subscribe();
      this.currentOrderId = null;
    }

    this.cancelFee = this.isDriverCloseForPenalty ? 2500 : 0;
    this.isCancelSuccessOpen = true;

    this.isSearchingDriver = false;
    this.isPaymentGatewayOpen = false;
    this.isDriverNotFound = false;
    this.isDriverFound = false;
    this.isDriverArrived = false;
    this.isInJourney = false;
    this.showInitialSuccessBanner = false;
    this.activeOrder = null;
    this.paymentInfo = null;
    this.paymentError = '';
    this.searchProgress = 0;
    this.searchElapsed = 0;
    
    this.clearDriverMarker();
    this.hideDropoffMarkerUntilJourneyStarts();
  }

  finishCancelFlow() {
    this.isCancelSuccessOpen = false;
    this.router.navigate(['/tabs/beranda']);
  }

  // ─── Map & Tracking Helpers ──────────────────────────────────────────────

  private applyActiveOrderRoute(order: ActiveOrder) {
    const pickupLat = Number(order.pickup_lat);
    const pickupLng = Number(order.pickup_lng);
    const dropoffLat = Number(order.dropoff_lat);
    const dropoffLng = Number(order.dropoff_lng);

    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLng) || !Number.isFinite(dropoffLat) || !Number.isFinite(dropoffLng)) {
      return;
    }

    this.startCoord = [pickupLng, pickupLat];
    this.destCoord = [dropoffLng, dropoffLat];
    this.jemput = order.pickup_address;
    this.tujuan = order.dropoff_address;

    if (order.vehicle_type) {
      this.vehicle = order.vehicle_type;
      this.selectedVehicle = order.vehicle_type;
      this.sortVehicles();
    }

    if (order.payment_method) {
      this.selectedPayment = ['tunai', 'cash'].includes(order.payment_method.toLowerCase()) 
        ? 'tunai' 
        : (order.payment_method.toLowerCase() === 'wallet' ? 'wallet' : 'nontunai');
      if (this.selectedPayment === 'nontunai') {
        this.selectedNonTunai = this.normalizePaymentCode(order.payment_method);
      }
    }

    if (!this.map) {
      return;
    }

    if (this.pickupMarker) {
      this.pickupMarker.remove();
      this.pickupMarker = null;
    }

    if (this.dropoffMarker) {
      this.dropoffMarker.remove();
      this.dropoffMarker = null;
    }

    // Only draw pickup marker if the trip has NOT started yet
    if (order.status !== 'started') {
      this.pickupMarker = this.addMarker(this.startCoord, 'start');
    }

    if (order.status === 'started') {
      this.ensureDropoffMarker();
    } else if (!['accepted', 'arrived'].includes(order.status)) {
      this.ensureDropoffMarker();
      this.drawRoute(this.startCoord, this.destCoord);
    }
  }

  private clearDriverMarker() {
    if (this.driverAnimationId) {
      cancelAnimationFrame(this.driverAnimationId);
      this.driverAnimationId = null;
    }
    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }
  }

  private animateDriverMarker(targetLng: number, targetLat: number, targetHeading?: number) {
    if (!this.driverMarker) return;

    if (this.driverAnimationId) {
      cancelAnimationFrame(this.driverAnimationId);
      this.driverAnimationId = null;
    }

    const startPosition = this.driverMarker.getLngLat();
    const startLng = startPosition.lng;
    const startLat = startPosition.lat;

    // Ambil rotasi marker saat ini atau default ke 0
    let startHeading = this.driverMarker.getRotation() || 0;
    let endHeading = targetHeading !== undefined ? targetHeading : startHeading;

    // Normalisasi perbedaan rotasi untuk wrap-around (misal 350 derajat ke 10 derajat)
    let headingDiff = endHeading - startHeading;
    while (headingDiff < -180) headingDiff += 360;
    while (headingDiff > 180) headingDiff -= 360;

    const dist = Math.sqrt(Math.pow(targetLng - startLng, 2) + Math.pow(targetLat - startLat, 2));
    
    // Jika perubahannya sangat kecil, set langsung tanpa animasi
    if (dist < 0.000005 && Math.abs(headingDiff) < 1) {
      this.driverMarker.setLngLat([targetLng, targetLat]);
      this.driverMarker.setRotation(endHeading);
      return;
    }

    const duration = 1500; // Durasi animasi 1.5 detik (menyeimbangkan responsivitas dan kehalusan)
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Interpolasi linear koordinat
      const currentLng = startLng + (targetLng - startLng) * progress;
      const currentLat = startLat + (targetLat - startLat) * progress;

      // Interpolasi linear rotasi
      const currentHeading = startHeading + headingDiff * progress;

      this.driverMarker.setLngLat([currentLng, currentLat]);
      this.driverMarker.setRotation((currentHeading + 360) % 360);

      if (progress < 1) {
        this.driverAnimationId = requestAnimationFrame(frame);
      } else {
        this.driverAnimationId = null;
      }
    };

    this.driverAnimationId = requestAnimationFrame(frame);
  }

  drawnRoutePhase: string | null = null;

  updateDriverMapAndETA(order: ActiveOrder) {
    if (!this.map || !order.driver?.current_lat || !order.driver?.current_lng || !this.isPageActive) return;

    const dLat = parseFloat(order.driver.current_lat as any);
    const dLng = parseFloat(order.driver.current_lng as any);
    const isInStartedPhase = order.status === 'started';
    const phase = isInStartedPhase ? 'to_dropoff' : 'to_pickup';

    // Pertama kali: buat marker driver & fitBounds agar peta berpindah ke rute baru
    const isFirstCall = !this.driverMarker;

    // Update Driver Marker
    if (!this.driverMarker) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      const vehicleImg = (order.driver.vehicle_type || this.selectedVehicle) === 'mobil' ? 'assets/mobil driver.png' : 'assets/Motor driver.png';
      el.innerHTML = `<img src="${vehicleImg}" style="width:40px;height:40px;object-fit:contain;" />`;
      this.driverMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([dLng, dLat])
        .addTo(this.map);
    } else {
      this.animateDriverMarker(dLng, dLat, order.driver.heading ?? undefined);
    }

    if (isInStartedPhase) {
      this.ensureDropoffMarker();
      // Remove pickup marker when trip has started!
      if (this.pickupMarker) {
        this.pickupMarker.remove();
        this.pickupMarker = null;
      }
    } else {
      this.hideDropoffMarkerUntilJourneyStarts();
    }

    // Hitung ETA selalu update (menggunakan posisi driver saat ini)
    const etaStart = [dLng, dLat];
    const etaDest = isInStartedPhase ? this.destCoord : this.startCoord;

    this.tomtomService.calculateRoute(etaStart[1], etaStart[0], etaDest[1], etaDest[0], order.vehicle_type || this.selectedVehicle).subscribe({
      next: (res: any) => {
        if (res.routes && res.routes.length > 0) {
          const routeData = this.selectPreferredRoute(res.routes);
          if (!routeData) return;

          const travelMinutes = Math.ceil(routeData.summary.travelTimeInSeconds / 60);
          this.driverEtaText = `${travelMinutes} Menit`;

          // HANYA gambar ulang rute jika fase berubah atau baru pertama kali,
          // agar jalur oranye tidak melompat-lompat (jitter) saat update lokasi
          if (this.drawnRoutePhase !== phase) {
            this.drawnRoutePhase = phase;
            // Agar rute lebih stabil, saat started kita gambar dari titik penjemputan ke tujuan.
            // Saat accepted, dari lokasi awal driver (saat ini) ke penjemputan.
            const drawStart = isInStartedPhase ? this.startCoord : etaStart;
            const drawDest = etaDest;

            this.tomtomService.calculateRoute(drawStart[1], drawStart[0], drawDest[1], drawDest[0], order.vehicle_type || this.selectedVehicle).subscribe({
              next: (drawRes: any) => {
                if (drawRes.routes && drawRes.routes.length > 0) {
                  this.drawRoute(drawStart, drawDest, isFirstCall, drawRes);
                }
              }
            });
          }
        }
      }
    });
  }

  private ensureDropoffMarker() {
    if (!this.map || this.dropoffMarker) return;
    this.dropoffMarker = this.addMarker(this.destCoord, 'dest');
  }

  private hideDropoffMarkerUntilJourneyStarts() {
    if (this.dropoffMarker) {
      this.dropoffMarker.remove();
      this.dropoffMarker = null;
    }
  }

  private restorePreOrderRoute() {
    if (!this.map) return;
    this.ensureDropoffMarker();
    this.drawRoute(this.startCoord, this.destCoord);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getDriverPhoto(): string {
    return this.activeOrder?.driver?.photo || 'assets/Profile-Default.jpeg';
  }

  getDriverName(): string {
    return this.activeOrder?.driver?.name || 'Driver';
  }

  getDriverRating(): string {
    const r = this.activeOrder?.driver?.rating;
    return r ? parseFloat(r.toString()).toFixed(1) : '4.8';
  }

  getDriverVehicle(): string {
    return this.activeOrder?.driver?.vehicle_type || this.selectedVehicle;
  }

  getDriverPlate(): string {
    return this.activeOrder?.driver?.plate_number || 'B 4309 FOJ';
  }

  getDriverVehicleBrand(): string {
    return this.activeOrder?.driver?.vehicle_brand || 'Honda Beat';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }

  goToChat() {
    if (this.currentOrderId) {
      this.isNavigatingAway = true;
      this.router.navigate(['/tabs/pesan'], { queryParams: { order_id: this.currentOrderId } });
    }
  }

  downloadQrCode() {
    const qrImage = this.getPaymentQrImage();
    if (!qrImage) return;

    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `FIVGO-QRIS-${this.getPaymentReference()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('QR Code berhasil disimpan ke galeri/unduhan.', 'success');
  }

  // ─── Drag Methods ────────────────────────────────────────────────────────

  setSheetPosition(percentage: number) {
    this.currentY = percentage;
    this.backdropOpacity = 0;
  }

  handleStart(e: any) {
    this.isDragging = true;
    this.startY = e.type === 'mousedown' ? e.pageY : e.touches[0].pageY;
    this.startTranslateY = this.currentY;
  }

  handleContentStart(e: any) {
    // Only start drag if content is scrolled to top
    if (this.sheetContentEl && this.sheetContentEl.nativeElement.scrollTop <= 0) {
      this.isDragging = true;
      this.startY = e.type === 'mousedown' ? e.pageY : e.touches[0].pageY;
      this.startTranslateY = this.currentY;
    }
  }

  handleNoteStart(e: any) {
    this.isDraggingNote = true;
    this.noteStartY = e.type === 'mousedown' ? e.pageY : e.touches[0].pageY;
    this.noteStartTranslateY = this.noteY;
  }

  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  onMove(e: any) {
    if (this.isDragging) {
      const y = e.type === 'mousemove' ? e.pageY : e.touches[0].pageY;
      const delta = y - this.startY;
      
      const element = this.sheetContentEl?.nativeElement?.parentElement;
      const sheetHeight = element ? element.offsetHeight : 350;
      const deltaPercent = (delta / sheetHeight) * 100;
      
      let nextY = this.startTranslateY + deltaPercent;
      
      if (nextY < this.FULL) {
        nextY = this.FULL - (Math.pow(this.FULL - nextY, 0.5)); 
      }
      if (nextY > 100) nextY = 100; 
      
      this.setSheetPosition(nextY);
      
      // Prevent default only for touch events (avoid error on mousemove)
      if (e.cancelable && e.type !== 'mousemove') {
        e.preventDefault();
      }
    } else if (this.isDraggingNote) {
      const y = e.type === 'mousemove' ? e.pageY : e.touches[0].pageY;
      const delta = y - this.noteStartY;
      
      const sheetHeight = 350; // Approximate height of note modal
      const deltaPercent = (delta / sheetHeight) * 100;
      
      let nextY = this.noteStartTranslateY + deltaPercent;
      if (nextY < 0) {
        nextY = nextY * 0.2; // Resistance when pulling up
      }
      this.noteY = nextY;
      
      if (e.cancelable && e.type !== 'mousemove') {
        e.preventDefault();
      }
    } else if (this.isDraggingPromo) {
      const y = e.type === 'mousemove' ? e.pageY : e.touches[0].pageY;
      const delta = y - this.promoStartY;
      
      const sheetHeight = 500; // Approximate height of promo modal
      const deltaPercent = (delta / sheetHeight) * 100;
      
      let nextY = this.promoStartTranslateY + deltaPercent;
      if (nextY < 0) {
        nextY = nextY * 0.2; // Resistance when pulling up
      }
      this.promoY = nextY;
      
      if (e.cancelable && e.type !== 'mousemove') {
        e.preventDefault();
      }
    }
  }

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  onEnd() {
    if (this.isDragging) {
      this.isDragging = false;

      if (this.currentY > 40) {
        // Dragged down significantly, cancel/go back
        this.goBack();
      } else {
        // Snap back to fully open
        this.setSheetPosition(this.FULL);
        this.contentOverflowY = 'hidden';
      }
    } else if (this.isDraggingNote) {
      this.isDraggingNote = false;
      // If dragged down by more than 25%, close the modal
      if (this.noteY > 25) {
        this.closeNoteModal();
      } else {
        // Snap back
        this.noteY = 0;
      }
    } else if (this.isDraggingPromo) {
      this.isDraggingPromo = false;
      if (this.promoY > 25) {
        this.closePromoModal();
      } else {
        this.promoY = 0;
      }
    }
  }

  private userLocationMarker: any = null;
  private watchId: string | null = null;

  async startWatchingUserLocation() {
    if (this.watchId) return;

    try {
      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }, (position, err) => {
        if (err || !position || !position.coords) {
          console.warn('Geolocation watch error:', err);
          return;
        }

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.lastUserLngLat = [lng, lat];

        // JIKA sedang dalam mode booking (belum buat order) DAN lokasi penjemputan adalah "Lokasi Saat Ini"
        if (!this.currentOrderId && this.jemput && this.jemput.toLowerCase() === 'lokasi saat ini') {
          this.startCoord = [lng, lat];
          if (this.pickupMarker) {
            this.pickupMarker.setLngLat([lng, lat]);
          }
          
          // Re-draw rute & update harga jika rute/lokasi berubah
          this.fetchPrices(this.startCoord, this.destCoord);
          this.drawRoute(this.startCoord, this.destCoord, false); // Jangan auto-fitBounds terus-menerus agar tidak mengganggu zoom user
        }

        this.cdr.detectChanges();

        if (!this.map) return;

        // If userLocationMarker does not exist, create it as a pulsing blue dot
        if (!this.userLocationMarker) {
          const el = document.createElement('div');
          el.className = 'user-location-pulse';
          el.style.width = '22px';
          el.style.height = '22px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = '#007AFF';
          el.style.border = '3px solid #ffffff';
          el.style.boxShadow = '0 0 10px rgba(0, 122, 255, 0.6)';
          el.style.position = 'relative';
          
          // Pulsing effect
          const pulse = document.createElement('div');
          pulse.style.position = 'absolute';
          pulse.style.top = '-9px';
          pulse.style.left = '-9px';
          pulse.style.width = '34px';
          pulse.style.height = '34px';
          pulse.style.borderRadius = '50%';
          pulse.style.border = '2px solid #007AFF';
          pulse.style.opacity = '0';
          pulse.style.animation = 'pulseGps 2.2s infinite';
          el.appendChild(pulse);

          // Add CSS animation dynamically to header or use active SCSS style
          const style = document.createElement('style');
          style.innerHTML = `
            @keyframes pulseGps {
              0% { transform: scale(0.6); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          `;
          document.head.appendChild(style);

          this.userLocationMarker = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(this.map);
        } else {
          this.userLocationMarker.setLngLat([lng, lat]);
        }
      });
    } catch (e) {
      console.warn('Failed to start Geolocation watch:', e);
    }
  }

  recenterMapOnUser() {
    if (this.map && this.lastUserLngLat) {
      this.isMapPanned = false;
      this.cdr.detectChanges();
      
      this.map.easeTo({
        center: this.lastUserLngLat as any,
        zoom: 15,
        padding: { bottom: 220 }, // Offset center upwards by 220px to avoid bottom sheet obstruction
        duration: 1000
      });
    }
  }

  stopWatchingUserLocation() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
    if (this.userLocationMarker) {
      this.userLocationMarker.remove();
      this.userLocationMarker = null;
    }
  }
}
