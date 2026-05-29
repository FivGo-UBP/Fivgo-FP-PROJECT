import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
declare var mapboxgl: any;
import { environment } from '../../../environments/environment';
import { TomtomService } from '../../services/tomtom.service';
import { OrderService, ActiveOrder } from '../../services/order.service';
import { ToastController, NavController } from '@ionic/angular';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { AuthService } from '../../services/auth.service';
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

  // Metode pembayaran
  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'Dana';

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
  private driverMarker: any = null;

  // ─── Driver Marker Animation State ────────────────────────────────────────
  private driverAnimationId: any = null;
  private driverLastCoords: [number, number] | null = null;
  private driverLastBearing: number = 0;
  private echo: Echo<any> | null = null;

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
    private cdr: ChangeDetectorRef,
    private authService: AuthService
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
    this.stopDriverAnimation();
    this.disconnectWebSocket();
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
          this.connectWebSocket(this.activeOrder.id);
        }
      }
      return;
    }

    this.isPageActive = true;
    
    // Periksa apakah ada pesanan aktif saat halaman dimuat
    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        if (order) {
          if (order.status === 'pending') {
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
            this.connectWebSocket(order.id);
          }
        } else {
          // Modal will be opened in ionViewDidEnter
        }
      },
      error: () => {
        // Modal will be opened in ionViewDidEnter
      }
    });

    const savedPayment = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');
    if (savedPayment) this.selectedPayment = savedPayment;
    if (savedNonTunai) this.selectedNonTunai = savedNonTunai;
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

  ionViewWillLeave() {
    this.isPageActive = false;
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;

    if (this.isNavigatingAway) {
      // Sembunyikan modal supaya tidak terbawa ke halaman chat
      this.isDriverFound = false;
      this.isDriverArrived = false;
      this.isInJourney = false;
      return; // Jangan stop polling jika hanya ke halaman chat
    }

    this.stopSearch();
    this.stopOrderPolling();
    this.stopDriverAnimation();
    this.disconnectWebSocket();
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

  drawRoute(start: number[], dest: number[], shouldFitBounds: boolean = true) {
    if (!this.map || !this.isPageActive) return;

    this.tomtomService.calculateRoute(start[1], start[0], dest[1], dest[0], this.selectedVehicle).subscribe((res: any) => {
      if (!this.map || !res.routes || res.routes.length === 0) return;
      
      if (!this.map.isStyleLoaded()) {
        this.map.once('idle', () => this.drawRoute(start, dest, shouldFitBounds));
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

        if (shouldFitBounds) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          for (const coord of coordinates) bounds.extend(coord as any);
          this.map.fitBounds(bounds, { padding: 50 });
        }
      }
    }, err => console.error('Error fetching route from TomTom:', err));
  }

  drawRouteFromBackend(orderId: string, shouldFitBounds: boolean = true) {
    if (!this.map || !this.isPageActive) return;

    this.orderService.getOrderRoute(orderId).subscribe({
      next: (res: any) => {
        if (!this.map || !res.coordinates || res.coordinates.length === 0) return;

        // Pastikan style map sudah loaded sebelum manipulasi layer
        if (!this.map.isStyleLoaded()) {
          this.map.once('idle', () => this.drawRouteFromBackend(orderId, shouldFitBounds));
          return;
        }

        const coordinates = res.coordinates;

        // Tampilkan ETA dan Jarak dari backend jika tersedia
        if (res.eta_minutes !== undefined) {
          this.driverEtaText = `${res.eta_minutes} Menit`;
        }

        // Bersihkan layer dan source lama agar tidak duplikat
        if (this.map.getLayer('route-line-main')) this.map.removeLayer('route-line-main');
        if (this.map.getSource('route-main')) this.map.removeSource('route-main');

        // Bersihkan alternatif rute dari preview lama juga jika ada
        for (let i = 0; i < 5; i++) {
          if (this.map.getLayer(`route-line-${i}`)) this.map.removeLayer(`route-line-${i}`);
          if (this.map.getSource(`route-${i}`)) this.map.removeSource(`route-${i}`);
        }

        // Tambah source GeoJSON LineString
        this.map.addSource('route-main', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        // Gambar garis rute utama (oranye)
        this.map.addLayer({
          id: 'route-line-main',
          type: 'line',
          source: 'route-main',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF9800',
            'line-width': 5,
            'line-opacity': 0.85
          }
        });

        // fitBounds otomatis agar semua marker muat dalam layar HP secara proposional
        if (shouldFitBounds) {
          const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
          for (const coord of coordinates) {
            bounds.extend(coord as any);
          }
          this.map.fitBounds(bounds, {
            padding: { top: 80, bottom: 250, left: 50, right: 50 }, // Padding bawah disesuaikan dengan tinggi Bottom Sheet UI
            duration: 1500 // Kecepatan animasi transisi kamera (1.5 detik)
          });
        }
      },
      error: (err) => console.error('Gagal mengambil rute dari backend:', err)
    });
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
    this.isNoteModalOpen = true;
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

  // ─── CARI DRIVER & ORDER FLOW ─────────────────────────────────────────────

  /** Dipanggil saat tombol "Pesan Sekarang" ditekan */
  startSearch() {
    this.isVehicleModalOpen = false;
    this.isNoteModalOpen = false;
    this.isPageActive = false;
    
    setTimeout(() => {
      this.isSearchingDriver = true;
      this.isDriverNotFound = false;
      this.searchProgress = 0;
      this.searchElapsed = 0;
      this.cdr.detectChanges();
    }, 350);

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
            this.isPageActive = true;
            this.stopSearch();
            this.isSearchingDriver = false;
            
            setTimeout(() => {
              this.isDriverFound = true;
              this.showInitialSuccessBanner = true;
              this.cdr.detectChanges();
              setTimeout(() => {
                this.showInitialSuccessBanner = false;
              }, 4000);
            }, 350);
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'accepted' && this.isDriverFound) {
            // Driver sedang menuju penjemputan — tracking terus-menerus
            this.isPageActive = true;
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'arrived' && !this.isDriverArrived) {
            this.isPageActive = true;
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isDriverFound = true;
            this.isDriverArrived = true;
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'arrived' && this.isDriverArrived) {
            // Driver sudah di titik, tetap update marker posisi
            this.isPageActive = true;
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'started' && !this.isInJourney) {
            this.isPageActive = true;
            this.stopSearch();
            this.isSearchingDriver = false;
            this.isDriverFound = true;
            this.isDriverArrived = true;
            this.isInJourney = true;
            // Reset marker agar fitBounds terjadi lagi untuk rute baru (driver → tujuan)
            if (this.driverMarker) {
              this.driverMarker.remove();
              this.driverMarker = null;
            }
            this.stopDriverAnimation();
            this.driverLastCoords = null;
            this.driverLastBearing = 0;
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'started' && this.isInJourney) {
            // Dalam perjalanan — tracking terus-menerus
            this.isPageActive = true;
            this.connectWebSocket(order.id);
            this.updateDriverMapAndETA(order);
          } else if (order.status === 'completed') {
            this.stopSearch();
            this.isSearchingDriver = false;
            this.stopOrderPolling();
            this.disconnectWebSocket();
            this.isOrderComplete = true;
            this.isNavigatingAway = true; // Prevents polling restart
            
            // Navigate to rating page
            this.router.navigate(['/rating-driver'], { queryParams: { order_id: order.id } });
            
          } else if (order.status === 'rejected' || order.status === 'cancelled') {
            this.stopOrderPolling();
            this.disconnectWebSocket();
            this.showToast('Pesanan dibatalkan atau ditolak oleh driver. Silakan pesan ulang.', 'danger');
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
          } else if (order.status === 'rejected' || order.status === 'cancelled') {
            this.stopOrderPolling();
            this.showToast('Pesanan dibatalkan atau ditolak.', 'danger');
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
    this.disconnectWebSocket();

    // Batalkan order di backend jika sudah dibuat
    if (this.currentOrderId) {
      this.orderService.cancelOrder(this.currentOrderId, 'Customer cancelled search').subscribe();
      this.currentOrderId = null;
    }

    this.isSearchingDriver = false;
    this.isDriverNotFound = false;
    this.searchProgress = 0;
    this.searchElapsed = 0;
    this.isNoteModalOpen = false;

    setTimeout(() => {
      this.isVehicleModalOpen = true;
      this.setSheetPosition(this.COLLAPSED);
      this.isPageActive = true;
      this.cdr.detectChanges();
    }, 350);
  }


  retrySearch() {
    this.isDriverNotFound = false;
    this.activeOrder = null;
    this.currentOrderId = null;
    
    setTimeout(() => {
      this.startSearch();
    }, 350);
  }

  cancelOrder() {
    this.stopSearch();
    this.stopOrderPolling();
    this.disconnectWebSocket();

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
    this.isNoteModalOpen = false;
    
    setTimeout(() => {
      this.isVehicleModalOpen = true;
      this.setSheetPosition(this.COLLAPSED);
      this.isPageActive = true;
      this.cdr.detectChanges();
    }, 350);
    
    if (this.driverMarker) {
      this.driverMarker.remove();
      this.driverMarker = null;
    }
    this.stopDriverAnimation();
    this.driverLastCoords = null;
    this.driverLastBearing = 0;
  }

  // ─── Map & Tracking Helpers ──────────────────────────────────────────────

  updateDriverMapAndETA(order: ActiveOrder) {
    if (!this.map || !order.driver?.current_lat || !order.driver?.current_lng || !this.isPageActive) return;

    const dLat = parseFloat(order.driver.current_lat as any);
    const dLng = parseFloat(order.driver.current_lng as any);
    const endCoords: [number, number] = [dLng, dLat];

    const isFirstCall = !this.driverMarker;

    // Update Driver Marker
    if (!this.driverMarker) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      const vehicleImg = (order.driver.vehicle_type || this.selectedVehicle) === 'mobil' ? 'assets/mobil driver.png' : 'assets/Motor driver.png';
      el.innerHTML = `<img src="${vehicleImg}" style="width:40px;height:40px;object-fit:contain;transition:transform 0.1s ease;" />`;
      this.driverMarker = new mapboxgl.Marker({ element: el })
        .setLngLat(endCoords)
        .addTo(this.map);

      this.driverLastCoords = endCoords;
      this.driverLastBearing = 0;
    } else {
      // Dapatkan koordinat awal (posisi terinterpolasi terakhir atau posisi marker saat ini)
      const startCoords = this.driverLastCoords || (this.driverMarker.getLngLat().toArray() as [number, number]);

      // Hitung bearing baru jika ada pergeseran yang cukup signifikan (menghindari jittering)
      let targetBearing = this.driverLastBearing;
      const distance = Math.sqrt(Math.pow(endCoords[0] - startCoords[0], 2) + Math.pow(endCoords[1] - startCoords[1], 2));

      if (distance > 0.00001) {
        targetBearing = this.calculateBearing(startCoords[1], startCoords[0], endCoords[1], endCoords[0]);
      }

      // Mulai animasi pergeseran dan rotasi yang mulus
      this.animateDriverMarker(startCoords, endCoords, targetBearing, 2500);
    }

    // Draw route and update ETA from backend dynamically
    this.drawRouteFromBackend(order.id, isFirstCall);
  }

  calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const rLat1 = lat1 * Math.PI / 180;
    const rLat2 = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) -
              Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
              
    const radians = Math.atan2(y, x);
    const degrees = (radians * 180 / Math.PI + 360) % 360;
    return degrees;
  }

  interpolateAngle(from: number, to: number, t: number): number {
    let diff = to - from;
    // Menormalisasi perbedaan ke rentang -180 hingga 180 derajat
    diff = ((diff + 180) % 360) - 180;
    if (diff < -180) diff += 360;
    return from + diff * t;
  }

  animateDriverMarker(startCoords: [number, number], endCoords: [number, number], targetBearing: number, duration: number = 2500) {
    this.stopDriverAnimation();

    const startTime = performance.now();
    const startBearing = this.driverLastBearing;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);

      // LERP Posisi
      const lng = startCoords[0] + (endCoords[0] - startCoords[0]) * t;
      const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * t;

      // Interpolasi Sudut Bearing
      const currentBearing = this.interpolateAngle(startBearing, targetBearing, t);
      this.driverLastBearing = currentBearing;

      if (this.driverMarker) {
        this.driverMarker.setLngLat([lng, lat]);
        
        // Putar image di dalam marker agar tidak mengganggu layout pin Mapbox
        const el = this.driverMarker.getElement();
        const img = el.querySelector('img');
        if (img) {
          img.style.transform = `rotate(${currentBearing}deg)`;
          img.style.transition = 'none'; // Matikan transisi CSS agar sinkron dengan requestAnimationFrame
        } else {
          // Fallback ke rotasi bawaan Mapbox GL
          this.driverMarker.setRotation(currentBearing);
        }
      }

      if (t < 1 && this.isPageActive) {
        this.driverAnimationId = requestAnimationFrame(step);
      } else {
        this.driverLastCoords = endCoords;
      }
    };

    this.driverAnimationId = requestAnimationFrame(step);
  }

  stopDriverAnimation() {
    if (this.driverAnimationId) {
      cancelAnimationFrame(this.driverAnimationId);
      this.driverAnimationId = null;
    }
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

  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  onMove(e: any) {
    if (!this.isDragging) return;
    
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
  }

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  onEnd() {
    if (!this.isDragging) return;
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
  }

  private connectWebSocket(orderId: string) {
    if (this.echo) return;

    const token = this.authService.getToken();
    if (!token) return;

    (window as any).Pusher = Pusher;

    this.echo = new Echo({
      broadcaster: 'reverb',
      key: environment.reverb.key,
      wsHost: environment.reverb.host,
      wsPort: environment.reverb.port,
      wssPort: environment.reverb.port,
      forceTLS: environment.reverb.scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${environment.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    this.echo.private(`order.tracking.${orderId}`)
      .listen('DriverLocationUpdated', (data: any) => {
        if (!this.map || !this.isPageActive) return;

        const dLat = parseFloat(data.lat as any);
        const dLng = parseFloat(data.lng as any);
        const endCoords: [number, number] = [dLng, dLat];

        // Jika dipanggil pertama kali (marker belum ada)
        const isFirstCall = !this.driverMarker;

        // Update Driver Marker
        if (!this.driverMarker) {
          const el = document.createElement('div');
          el.className = 'driver-marker';
          const vehicleImg = (this.activeOrder?.vehicle_type || this.selectedVehicle) === 'mobil' ? 'assets/mobil driver.png' : 'assets/Motor driver.png';
          el.innerHTML = `<img src="${vehicleImg}" style="width:40px;height:40px;object-fit:contain;transition:transform 0.1s ease;" />`;
          this.driverMarker = new mapboxgl.Marker({ element: el })
            .setLngLat(endCoords)
            .addTo(this.map);

          this.driverLastCoords = endCoords;
          this.driverLastBearing = 0;
        } else {
          // Dapatkan koordinat awal (posisi terinterpolasi terakhir atau posisi marker saat ini)
          const startCoords = this.driverLastCoords || (this.driverMarker.getLngLat().toArray() as [number, number]);

          // Hitung bearing baru jika ada pergeseran yang cukup signifikan (menghindari jittering)
          let targetBearing = this.driverLastBearing;
          const distance = Math.sqrt(Math.pow(endCoords[0] - startCoords[0], 2) + Math.pow(endCoords[1] - startCoords[1], 2));

          if (distance > 0.00001) {
            targetBearing = this.calculateBearing(startCoords[1], startCoords[0], endCoords[1], endCoords[0]);
          }

          // Mulai animasi pergeseran dan rotasi yang mulus
          this.animateDriverMarker(startCoords, endCoords, targetBearing, 2500);
        }

        // Draw route and update ETA
        this.drawRouteFromBackend(orderId, isFirstCall);
      });
  }

  private disconnectWebSocket() {
    if (this.echo && this.currentOrderId) {
      this.echo.leave(`order.tracking.${this.currentOrderId}`);
      this.echo.disconnect();
    }
    this.echo = null;
  }
}
