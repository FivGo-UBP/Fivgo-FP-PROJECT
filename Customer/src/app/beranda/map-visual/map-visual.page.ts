import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
declare var mapboxgl: any;
import { environment } from '../../../environments/environment';
import { TomtomService } from '../../services/tomtom.service';
import { OrderService, ActiveOrder } from '../../services/order.service';
import { ToastController, NavController } from '@ionic/angular';
@Component({
  selector: 'app-map-visual',
  templateUrl: './map-visual.page.html',
  styleUrls: ['./map-visual.page.scss'],
  standalone: false,
})
export class MapVisualPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: false }) mapContainer!: ElementRef;
  @ViewChild('vehicleModal', { static: false }) vehicleModal!: any;
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

  // Metode pembayaran
  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'Dana';

  // ─── State Pencarian Driver ───────────────────────────────────────────────
  isSearchingDriver: boolean = false;
  isDriverNotFound: boolean = false;
  searchProgress: number = 0;
  private searchTimer: any = null;
  private searchDuration: number = 45;
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
  private orderPollingInterval: any = null;
  
  driverEtaText: string = 'Menghitung...';
  private driverMarker: any = null;

  vehicles = [
    { type: 'motor', name: 'Motor', time: '', capacity: 1, price: '', image: 'assets/motor.png', isLoading: true },
    { type: 'mobil', name: 'Mobil', time: '', capacity: 4, price: '', image: 'assets/mobil.png', isLoading: true }
  ];
  selectedVehicle: string = 'motor';

  constructor(
    private tomtomService: TomtomService,
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['jLat'] && params['jLng']) {
        this.startCoord = [parseFloat(params['jLng']), parseFloat(params['jLat'])];
      }
      if (params['tLat'] && params['tLng']) {
        this.destCoord = [parseFloat(params['tLng']), parseFloat(params['tLat'])];
      }
      if (params['jemput']) this.jemput = params['jemput'];
      if (params['tujuan']) this.tujuan = params['tujuan'];
      if (params['vehicle']) {
        this.vehicle = params['vehicle'];
        this.selectedVehicle = this.vehicle;
        this.sortVehicles();
      }
    });
  }

  ngOnDestroy() {
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

  ionViewWillEnter() {
    if (this.isNavigatingAway) {
      this.isNavigatingAway = false;
      return;
    }

    this.isPageActive = true;
    this.isVehicleModalOpen = true;

    const savedPayment = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');
    if (savedPayment) this.selectedPayment = savedPayment;
    if (savedNonTunai) this.selectedNonTunai = savedNonTunai;
  }

  ionViewDidEnter() {
    try {
      this.initMap();
    } catch (e: any) {
      alert("System Error Map: " + (e.message || e));
    }
  }

  ionViewWillLeave() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.stopSearch();
    this.stopOrderPolling();
  }

  goBack() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    setTimeout(() => {
      this.navCtrl.back();
    }, 300);
  }

  goToMetodePembayaran() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    setTimeout(() => {
      this.router.navigate(['/metode-pembayaran']);
    }, 300);
  }

  initMap() {
    if (typeof mapboxgl === 'undefined') {
      setTimeout(() => this.initMap(), 500);
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
      this.addMarker(this.startCoord, 'start');
      this.addMarker(this.destCoord, 'dest');
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

    new mapboxgl.Marker(el)
      .setLngLat([coord[0], coord[1]] as any)
      .addTo(this.map);
  }

  fetchPrices(start: number[], dest: number[]) {
    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], 'motor').subscribe((res: any) => {
      const motor = this.vehicles.find(v => v.type === 'motor');
      if (res.routes && res.routes.length > 0) {
        res.routes.sort((a: any, b: any) => a.summary.lengthInMeters - b.summary.lengthInMeters);
        const distanceKm = res.routes[0].summary.lengthInMeters / 1000;
        const travelMinutes = Math.ceil(res.routes[0].summary.travelTimeInSeconds / 60);
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
        const distanceKm = res.routes[0].summary.lengthInMeters / 1000;
        const travelMinutes = Math.ceil(res.routes[0].summary.travelTimeInSeconds / 60);
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

  drawRoute(start: number[], dest: number[]) {
    if (!this.map) return;

    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], this.selectedVehicle).subscribe((res: any) => {
      if (!this.map || !res.routes || res.routes.length === 0) return;
      
      if (!this.map.isStyleLoaded()) {
        this.map.once('idle', () => this.drawRoute(start, dest));
        return;
      }

      if (res.routes && res.routes.length > 0) {
        res.routes.sort((a: any, b: any) => a.summary.lengthInMeters - b.summary.lengthInMeters);
        res.routes = [res.routes[0]];

        const routeData = res.routes[0];
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

        const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
        for (const coord of coordinates) bounds.extend(coord as any);
        this.map.fitBounds(bounds, { padding: 50 });
      }
    }, err => console.error('Error fetching route from TomTom:', err));
  }

  selectVehicle(type: string) {
    if (this.selectedVehicle === type) return;
    this.selectedVehicle = type;
    this.drawRoute(this.startCoord, this.destCoord);
  }

  updateCharCount(event: any) {
    if (this.driverNote.length > 150) this.driverNote = this.driverNote.substring(0, 150);
  }

  openNoteModal() {
    if (this.vehicleModal) this.vehicleModal.setCurrentBreakpoint(0.3);
    this.isNoteModalOpen = true;
  }

  closeNoteModal() {
    this.isNoteModalOpen = false;
    if (this.vehicleModal) this.vehicleModal.setCurrentBreakpoint(0.45);
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

  // ─── CARI DRIVER & ORDER FLOW ─────────────────────────────────────────────

  /** Dipanggil saat tombol "Pesan Sekarang" ditekan */
  startSearch() {
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPageActive = false;
    this.isSearchingDriver = true;
    this.isDriverNotFound = false;
    this.searchProgress = 0;
    this.searchElapsed = 0;

    // 1. Buat order di backend
    const orderData = {
      pickup_address: this.jemput,
      pickup_lat: this.startCoord[1],
      pickup_lng: this.startCoord[0],
      dropoff_address: this.tujuan,
      dropoff_lat: this.destCoord[1],
      dropoff_lng: this.destCoord[0],
      payment_method: this.selectedPayment === 'nontunai' ? this.selectedNonTunai : 'tunai',
      vehicle_type: this.selectedVehicle,
      notes: this.driverNote || undefined,
      estimated_price: this.getSelectedVehiclePriceRaw() || undefined
    };

    this.orderService.createOrder(orderData).subscribe({
      next: (order) => {
        this.currentOrderId = order.id;
        this.startOrderPolling();
      },
      error: (err) => {
        console.error('Gagal membuat order:', err);
        // Fallback: lanjutkan animasi pencarian meski backend gagal
        this.startProgressTimer();
      }
    });

    // Progress bar berjalan selama polling
    this.startProgressTimer();
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
    this.orderPollingInterval = setInterval(() => {
      if (!this.currentOrderId) return;
      this.orderService.getActiveOrder().subscribe({
        next: (order) => {
          if (!order) return;
          this.activeOrder = order;

          if (order.status === 'accepted' && !this.isDriverFound) {
            // Driver ditemukan!
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isDriverFound = true;
            this.showInitialSuccessBanner = true;
            setTimeout(() => {
              this.showInitialSuccessBanner = false;
            }, 4000);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'arrived' && !this.isDriverArrived) {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isDriverFound = true;
            this.isDriverArrived = true;
          } else if (order.status === 'started' && !this.isInJourney) {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isDriverFound = true;
            this.isDriverArrived = true;
            this.isInJourney = true;
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'completed') {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.stopOrderPolling();
            this.isOrderComplete = true;
          } else if (order.status === 'rejected' || order.status === 'cancelled') {
            this.stopOrderPolling();
            this.showToast('Pesanan dibatalkan atau ditolak oleh driver. Silakan pesan ulang.', 'danger');
            this.cancelOrder();
          }
        },
        error: (err) => console.error('Error polling order status:', err)
      });
    }, 4000);
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

    // Batalkan order di backend jika sudah dibuat
    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, 'Customer cancelled search').subscribe();
      this.currentOrderId = null;
    }

    this.isSearchingDriver = false;
    this.isDriverNotFound = false;
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.isVehicleModalOpen = true;
    this.isPageActive = true;
    this.isNoteModalOpen = false;
  }

  retrySearch() {
    this.isDriverNotFound = false;
    this.activeOrder = null;
    this.currentOrderId = null;
    this.startSearch();
  }

  cancelOrder() {
    this.stopSearch();
    this.stopOrderPolling();

    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, 'Customer cancelled').subscribe();
      this.currentOrderId = null;
    }

    this.isSearchingDriver = false;
    this.isDriverNotFound = false;
    this.isDriverFound = false;
    this.isDriverArrived = false;
    this.isInJourney = false;
    this.showInitialSuccessBanner = false;
    this.activeOrder = null;
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.isVehicleModalOpen = true;
    this.isPageActive = true;
    this.isNoteModalOpen = false;
    
    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }
  }

  // ─── Map & Tracking Helpers ──────────────────────────────────────────────

  updateDriverMapAndETA(order: ActiveOrder) {
    if (!this.map || !order.driver?.current_lat || !order.driver?.current_lng) return;

    const dLat = parseFloat(order.driver.current_lat as any);
    const dLng = parseFloat(order.driver.current_lng as any);

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

    let start = [dLng, dLat];
    let dest = this.startCoord;

    if (order.status === 'started') {
      start = [dLng, dLat];
      dest = this.destCoord;
    }

    // Draw route and update ETA
    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], order.vehicle_type || this.selectedVehicle).subscribe({
      next: (res: any) => {
        if (res.routes && res.routes.length > 0) {
          res.routes.sort((a: any, b: any) => a.summary.lengthInMeters - b.summary.lengthInMeters);
          const travelMinutes = Math.ceil(res.routes[0].summary.travelTimeInSeconds / 60);
          this.driverEtaText = `${travelMinutes} Menit`;
          this.drawRoute(start, dest);
        }
      }
    });
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
    return this.activeOrder?.driver?.plate_number || '-';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }
}
