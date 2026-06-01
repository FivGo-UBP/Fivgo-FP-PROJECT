import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
declare var mapboxgl: any;
import { environment } from '../../../environments/environment';
import { TomtomService } from '../../services/tomtom.service';
import { OrderService, ActiveOrder, PaymentRecord } from '../../services/order.service';
import { ToastController, NavController } from '@ionic/angular';
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
  isDriverArrived: boolean = false;
  isInJourney: boolean = false;
  isOrderComplete: boolean = false;
  showInitialSuccessBanner: boolean = false;
  isCheckingHistory: boolean = false;
  private orderPollingInterval: any = null;
  
  driverEtaText: string = 'Menghitung...';
  tripDistanceKm: number = 0;
  private driverMarker: any = null;
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
  currentY: number = 60; // 60% down (COLLAPSED)
  startTranslateY: number = 60;
  backdropOpacity: number = 0;
  contentOverflowY: string = 'hidden';

  // ─── Dragging State for Note Modal ────────────────────────────────────────
  isDraggingNote: boolean = false;
  noteY: number = 0;
  noteStartY: number = 0;
  noteStartTranslateY: number = 0;

  readonly COLLAPSED = 60;
  readonly HALF = 30;
  readonly FULL = 0;


  constructor(
    private tomtomService: TomtomService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private cdr: ChangeDetectorRef
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
            this.dompetxGatewayAmount = order.estimated_price || this.getSelectedVehiclePriceRaw();
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
                this.openDompetxGateway(order.id, order.estimated_price || this.getSelectedVehiclePriceRaw());
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
                this.isVehicleModalOpen = true;
                this.cdr.detectChanges();
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
  }

  ionViewDidEnter() {
    // Memberikan sedikit waktu setelah transisi halaman selesai agar modal tidak crash
    setTimeout(() => {
      if (!this.currentOrderId && !this.isSearchingDriver && !this.isDriverFound) {
        this.isVehicleModalOpen = true;
        this.setSheetPosition(this.COLLAPSED); // Reset position
        this.cdr.detectChanges();
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

    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }

    this.isPageActive = true;
    this.isVehicleModalOpen = true;
    this.setSheetPosition(this.COLLAPSED);
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

    setTimeout(() => {
      if (this.map) this.map.resize();
    }, 300);

    this.map.on('load', () => {
      this.pickupMarker = this.addMarker(this.startCoord, 'start');
      this.dropoffMarker = this.addMarker(this.destCoord, 'dest');
      this.fetchPrices(this.startCoord, this.destCoord);
      this.drawRoute(this.startCoord, this.destCoord);
      setTimeout(() => { this.map.resize(); }, 100);
    });
  }

  addMarker(coord: number[], type: 'start' | 'dest') {
    const el = document.createElement('div');
    el.className = 'marker';

    if (type === 'start') {
      el.style.backgroundColor = '#3880ff';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
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

  drawRoute(start: number[], dest: number[], shouldFitBounds: boolean = true) {
    if (!this.map || !this.isPageActive) return;

    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], this.selectedVehicle).subscribe((res: any) => {
      if (!this.map || !res.routes || res.routes.length === 0) return;
      
      if (!this.map.isStyleLoaded()) {
        this.map.once('idle', () => this.drawRoute(start, dest, shouldFitBounds));
        return;
      }

      if (res.routes && res.routes.length > 0) {
        const preferredRoute = this.selectPreferredRoute(res.routes);
        if (!preferredRoute) return;
        res.routes = [preferredRoute];

        const routeData = res.routes[0];
        this.tripDistanceKm = (routeData?.summary?.lengthInMeters || 0) / 1000;
        const routePoints = routeData.legs[0].points;
        const coordinates = routePoints.map((point: any) => [point.longitude, point.latitude]);

        if (this.map.getLayer('route-line-main')) this.map.removeLayer('route-line-main');
        if (this.map.getSource('route-main')) this.map.removeSource('route-main');
        for (let i = 0; i < 5; i++) {
          if (this.map.getLayer(`route-line-${i}`)) this.map.removeLayer(`route-line-${i}`);
          if (this.map.getSource(`route-${i}`)) this.map.removeSource(`route-${i}`);
        }

        for (let i = res.routes.length - 1; i >= 0; i--) {
          const routeData = res.routes[i];
          const routePoints = routeData.legs[0].points;
          const coordinates = routePoints.map((point: any) => [point.longitude, point.latitude]);
          const isMain = i === 0;
          const sourceId = isMain ? 'route-main' : `route-${i}`;
          const layerId = isMain ? 'route-line-main' : `route-line-${i}`;

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

        if (shouldFitBounds) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          for (const coord of coordinates) bounds.extend(coord as any);
          this.map.fitBounds(bounds, { padding: 50 });
        }
      }
    }, err => console.error('Error fetching route from TomTom:', err));
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

  getSelectedVehiclePrice(): string {
    const v = this.vehicles.find(v => v.type === this.selectedVehicle);
    return v?.price || 'Menghitung...';
  }

  getSelectedVehiclePriceRaw(): number {
    const v = this.vehicles.find(v => v.type === this.selectedVehicle);
    if (!v || !v.price || v.price === 'Error' || v.price === 'Menghitung...') return 0;
    return parseInt(v.price.replace(/[^0-9]/g, ''), 10);
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
      estimated_price: this.getSelectedVehiclePriceRaw() || undefined
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.currentOrderId = order.id;
        if (this.selectedPayment === 'nontunai' || this.selectedPayment === 'wallet') {
          this.openDompetxGateway(order.id, order.estimated_price || this.getSelectedVehiclePriceRaw());
          return;
        }
        this.beginDriverSearch();
      },
      error: (err) => {
        console.error('Gagal membuat order:', err);
        // Fallback: lanjutkan animasi pencarian meski backend gagal
        this.beginDriverSearch();
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
      this.searchProgress = Math.min(100, Math.round((this.searchElapsed / this.searchDuration) * 100));

      if (this.searchElapsed >= this.searchDuration) {
        this.stopSearch();
        this.stopOrderPolling();
        this.isSearchingDriver = false;
        this.isDriverNotFound = true;
      }
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
            if (this.driverMarker) {
              this.driverMarker.remove();
              this.driverMarker = null;
            }
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
      this.isVehicleModalOpen = true;
      this.setSheetPosition(this.COLLAPSED);
      this.isPageActive = true;
      this.restorePreOrderRoute();
      this.cdr.detectChanges();
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
      this.isVehicleModalOpen = true;
      this.setSheetPosition(this.COLLAPSED);
      this.isPageActive = true;
      this.restorePreOrderRoute();
      this.cdr.detectChanges();
    }, 350);
    
    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }
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
    
    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }
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
    }

    if (this.dropoffMarker) {
      this.dropoffMarker.remove();
      this.dropoffMarker = null;
    }

    this.pickupMarker = this.addMarker(this.startCoord, 'start');

    if (order.status === 'started') {
      this.ensureDropoffMarker();
    } else if (!['accepted', 'arrived'].includes(order.status)) {
      this.ensureDropoffMarker();
      this.drawRoute(this.startCoord, this.destCoord);
    }
  }

  updateDriverMapAndETA(order: ActiveOrder) {
    if (!this.map || !order.driver?.current_lat || !order.driver?.current_lng || !this.isPageActive) return;

    const dLat = parseFloat(order.driver.current_lat as any);
    const dLng = parseFloat(order.driver.current_lng as any);
    const isInStartedPhase = order.status === 'started';

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
      this.driverMarker.setLngLat([dLng, dLat]);
    }

    // Tentukan start & dest berdasarkan fase:
    // accepted/arrived = driver menuju pickup
    // started = driver menuju tujuan
    let start = [dLng, dLat];
    let dest = this.startCoord;

    if (isInStartedPhase) {
      start = [dLng, dLat];
      dest = this.destCoord;
      this.ensureDropoffMarker();
    } else {
      this.hideDropoffMarkerUntilJourneyStarts();
    }

    // Draw route and update ETA
    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], order.vehicle_type || this.selectedVehicle).subscribe({
      next: (res: any) => {
        if (res.routes && res.routes.length > 0) {
          const routeData = this.selectPreferredRoute(res.routes);
          if (!routeData) return;

          const travelMinutes = Math.ceil(routeData.summary.travelTimeInSeconds / 60);
          this.driverEtaText = `${travelMinutes} Menit`;
          // fitBounds hanya pada panggilan pertama agar peta reposisi ke rute driver→pickup/tujuan
          this.drawRoute(start, dest, isFirstCall);
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
    return this.activeOrder?.driver?.photo || 'https://ionicframework.com/docs/img/demos/avatar.svg';
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
    this.backdropOpacity = Math.max(0, (60 - percentage) / 60) * 0.4;
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
      
      const sheetHeight = window.innerHeight - 160; // Approximate height of sheet
      const deltaPercent = (delta / sheetHeight) * 100;
      
      let nextY = this.startTranslateY + deltaPercent;
      
      if (nextY < this.FULL) {
        nextY = this.FULL - (Math.pow(this.FULL - nextY, 0.5)); 
      }
      if (nextY > 75) nextY = 75; 
      
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
    }
  }

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  onEnd() {
    if (this.isDragging) {
      this.isDragging = false;

      if (this.currentY < 15) {
        this.setSheetPosition(this.FULL);
        this.contentOverflowY = 'auto';
      } else if (this.currentY < 45) {
        this.setSheetPosition(this.HALF);
        this.contentOverflowY = 'hidden';
      } else {
        this.setSheetPosition(this.COLLAPSED);
        this.contentOverflowY = 'hidden';
        if (this.sheetContentEl) {
          this.sheetContentEl.nativeElement.scrollTop = 0;
        }
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
    }
  }
}
