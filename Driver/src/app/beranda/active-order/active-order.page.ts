import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { OrderService, ActiveOrder } from '../../services/order.service';
import { TomtomService } from '../../services/tomtom.service';
import { Geolocation } from '@capacitor/geolocation';
declare var mapboxgl: any;
import { environment } from '../../../environments/environment';

/**
 * Phase 1 (accepted):  Driver menuju titik jemput
 * Phase 2 (arrived):   Driver sudah di titik jemput, menunggu customer
 * Phase 3 (started):   Dalam perjalanan ke tujuan
 */
@Component({
  selector: 'app-active-order',
  templateUrl: './active-order.page.html',
  styleUrls: ['./active-order.page.scss'],
  standalone: false,
})
export class ActiveOrderPage implements OnInit, OnDestroy, AfterViewInit {
  orderId: string = '';
  order: ActiveOrder | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  isArriving: boolean = false;
  isStarting: boolean = false;
  isCompleting: boolean = false;
  isCancelling: boolean = false;

  private map: any = null;
  private driverMarker: any = null;
  private pickupMarker: any = null;
  private dropoffMarker: any = null;
  private mapReady: boolean = false;

  private pollingInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private tomtomService: TomtomService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) {
      this.isLoading = false;
      this.hasError = true;
    }
  }

  ngAfterViewInit() {
    if (this.orderId) this.loadOrder();
  }

  ngOnDestroy() {
    this.stopPolling();
    if (this.map) { this.map.remove(); this.map = null; }
  }

  loadOrder() {
    this.isLoading = true;
    this.orderService.getActiveOrder().subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
        if (order) {
          this.startPolling();
          setTimeout(() => this.initMap(order), 800);
        }
      },
      error: () => { this.isLoading = false; this.hasError = true; }
    });
  }

  async initMap(order: ActiveOrder) {
    if (!mapboxgl) return;

    const pickupLat = parseFloat(order.pickup_lat as any);
    const pickupLng = parseFloat(order.pickup_lng as any);

    // Dapatkan posisi driver saat ini
    let driverLat = pickupLat - 0.005;
    let driverLng = pickupLng - 0.005;
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: 5000 });
      driverLat = pos.coords.latitude;
      driverLng = pos.coords.longitude;
    } catch (e) {
      console.warn('GPS tidak tersedia, menggunakan posisi fallback');
    }

    const container = document.getElementById('driver-active-map');
    if (!container) return;

    // Pastikan container punya ukuran sebelum init map
    container.style.width = '100%';
    container.style.height = '100%';

    mapboxgl.accessToken = environment.mapboxApiKey;
    this.map = new mapboxgl.Map({
      container: 'driver-active-map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [driverLng, driverLat],
      zoom: 14,
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.mapReady = true;
      // Force resize agar map mengisi container dengan benar
      setTimeout(() => {
        if (this.map) this.map.resize();
      }, 100);
      this.addMarkers(driverLat, driverLng, pickupLat, pickupLng, order);
      // Gambar rute dari posisi driver ke titik penjemputan menggunakan TomTom (SAMA seperti customer)
      this.drawRouteTomTom(driverLat, driverLng, pickupLat, pickupLng, order.vehicle_type || 'motor', 'accepted');
    });

    // Resize tambahan setelah map selesai render
    setTimeout(() => {
      if (this.map) this.map.resize();
    }, 500);
  }

  // Menggunakan TomTom API — rute SAMA PERSIS dengan yang ditampilkan di aplikasi customer
  drawRouteTomTom(fromLat: number, fromLng: number, toLat: number, toLng: number, vehicleType: string, phase: string) {
    this.tomtomService.calculateRoute(fromLat, fromLng, toLat, toLng, vehicleType).subscribe({
      next: (res: any) => {
        if (!res.routes || res.routes.length === 0 || !this.map) return;

        // Ambil rute terpendek (sama seperti logic di customer app)
        res.routes.sort((a: any, b: any) => a.summary.lengthInMeters - b.summary.lengthInMeters);
        const routeData = res.routes[0];
        const routePoints = routeData.legs[0].points;
        // TomTom mengembalikan {latitude, longitude}, Mapbox butuh [lng, lat]
        const coordinates: [number, number][] = routePoints.map((p: any) => [p.longitude, p.latitude]);

        // Hapus layer/source lama
        if (this.map.getLayer('route-layer')) this.map.removeLayer('route-layer');
        if (this.map.getSource('route')) this.map.removeSource('route');

        // Warna rute: oranye saat menuju jemput, biru tua saat mengantar
        const routeColor = phase === 'started' ? '#1a2b6d' : '#FF9800';

        this.map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
        });

        this.map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': routeColor, 'line-width': 5, 'line-opacity': 0.9 }
        });

        // Fit peta agar seluruh rute terlihat
        const bounds = coordinates.reduce(
          (b, c) => b.extend(c),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );
        this.map.fitBounds(bounds, { padding: { top: 80, bottom: 220, left: 40, right: 40 } });
      },
      error: (err) => console.error('TomTom routing error:', err)
    });
  }

  addMarkers(driverLat: number, driverLng: number, pickupLat: number, pickupLng: number, order: ActiveOrder) {
    // Marker driver: gambar kendaraan dari assets (sesuai jenis kendaraan yang dipesan)
    const vehicleType = order.vehicle_type || 'motor';
    const vehicleImg = vehicleType === 'mobil' ? 'assets/mobil driver.png' : 'assets/Motor driver.png';

    const driverEl = document.createElement('div');
    driverEl.className = 'driver-vehicle-marker';
    driverEl.style.width = '40px';
    driverEl.style.height = '40px';
    driverEl.style.display = 'flex';
    driverEl.style.alignItems = 'center';
    driverEl.style.justifyContent = 'center';
    driverEl.innerHTML = `<img src="${vehicleImg}" alt="${vehicleType}" style="width:100%;height:100%;object-fit:contain;" />`;
    this.driverMarker = new mapboxgl.Marker({ element: driverEl, anchor: 'center' })
      .setLngLat([driverLng, driverLat])
      .addTo(this.map);

    // Marker titik penjemputan (pin oranye)
    const pickupEl = document.createElement('div');
    pickupEl.className = 'pickup-pin-marker';
    pickupEl.innerHTML = `<div class="pin-dot"></div>`;
    this.pickupMarker = new mapboxgl.Marker({ element: pickupEl, anchor: 'center' })
      .setLngLat([pickupLng, pickupLat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${order.pickup_address}</strong>`))
      .addTo(this.map);
  }

  addDropoffMarker(order: ActiveOrder) {
    if (!this.map || this.dropoffMarker) return;
    const dropLat = parseFloat(order.dropoff_lat as any);
    const dropLng = parseFloat(order.dropoff_lng as any);
    if (!dropLat || !dropLng) return;

    const dropEl = document.createElement('div');
    dropEl.className = 'dropoff-pin-marker';
    dropEl.style.width = '36px';
    dropEl.style.height = '36px';
    dropEl.style.display = 'flex';
    dropEl.style.alignItems = 'center';
    dropEl.style.justifyContent = 'center';
    dropEl.style.filter = 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))';
    dropEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
        <path fill="#FF9800" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>`;
    this.dropoffMarker = new mapboxgl.Marker({ element: dropEl, anchor: 'bottom' })
      .setLngLat([dropLng, dropLat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${order.dropoff_address}</strong>`))
      .addTo(this.map);
  }

  updateMapForStartedPhase(order: ActiveOrder) {
    if (!this.map || !this.mapReady) return;

    const pickupLat = parseFloat(order.pickup_lat as any);
    const pickupLng = parseFloat(order.pickup_lng as any);
    const dropLat = parseFloat(order.dropoff_lat as any);
    const dropLng = parseFloat(order.dropoff_lng as any);

    if (!dropLat || !dropLng) return;

    // Pindahkan driver ke titik awal penjemputan saat sudah started
    if (this.driverMarker) {
      this.driverMarker.setLngLat([pickupLng, pickupLat]);
    }

    // Tambah marker tujuan
    this.addDropoffMarker(order);

    // Gambar rute dari titik jemput ke tujuan (TomTom, fase 'started')
    this.drawRouteTomTom(pickupLat, pickupLng, dropLat, dropLng, order.vehicle_type || 'motor', 'started');
  }

  startPolling() {
    this.pollingInterval = setInterval(() => {
      this.orderService.getActiveOrder().subscribe({
        next: (order) => {
          if (!order) {
            this.stopPolling();
            this.router.navigate(['/tabs/beranda']);
            return;
          }
          const prevStatus = this.order?.status;
          this.order = order;

          // Saat fase berubah ke 'started', update rute ke tujuan
          if (prevStatus !== 'started' && order.status === 'started') {
            this.updateMapForStartedPhase(order);
          }

          if (order.status === 'completed') {
            this.stopPolling();
            this.showToast('Perjalanan selesai!', 'success');
            setTimeout(() => this.router.navigate(['/tabs/beranda']), 2000);
          }
        },
        error: (err) => console.error('Polling error:', err)
      });
    }, 6000);
  }

  stopPolling() {
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  // ─── Phase 1 → arrived ───────────────────────────────────────────────────

  onArrivedAtPickup() {
    if (this.isArriving || !this.order) return;
    this.isArriving = true;
    this.orderService.arrivedAtPickup(this.order.id).subscribe({
      next: () => {
        this.isArriving = false;
        if (this.order) {
          this.order.status = 'arrived';
          // Tampilkan rute ke tujuan segera setelah tiba di titik jemput
          this.updateMapForStartedPhase(this.order);
        }
        this.showToast('Status: Sudah di titik penjemputan', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isArriving = false;
        if (this.order) {
          this.order.status = 'arrived';
          // Tampilkan rute ke tujuan segera setelah tiba di titik jemput (fallback local)
          this.updateMapForStartedPhase(this.order);
        }
        this.showToast('Status: Sudah di titik penjemputan', 'success');
      }
    });
  }

  // ─── Phase 2 → started ───────────────────────────────────────────────────

  onStartJourney() {
    if (this.isStarting || !this.order) return;
    this.isStarting = true;
    this.orderService.startOrder(this.order.id).subscribe({
      next: () => {
        this.isStarting = false;
        if (this.order) {
          this.order.status = 'started';
          this.updateMapForStartedPhase(this.order);
        }
        this.showToast('Perjalanan dimulai!', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isStarting = false;
        if (this.order) {
          this.order.status = 'started';
          this.updateMapForStartedPhase(this.order);
        }
        this.showToast('Perjalanan dimulai!', 'success');
      }
    });
  }

  // ─── Phase 3 → completed ─────────────────────────────────────────────────

  async onCompleteJourney() {
    if (this.isCompleting || !this.order) return;
    const alert = await this.alertCtrl.create({
      header: 'Selesaikan Perjalanan?',
      message: 'Pastikan customer sudah sampai di tujuan.',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        { text: 'Ya, Selesai', cssClass: 'alert-btn-primary', handler: () => this.completeJourney() }
      ]
    });
    await alert.present();
  }

  completeJourney() {
    this.isCompleting = true;
    this.orderService.completeOrder(this.order!.id).subscribe({
      next: () => {
        this.isCompleting = false;
        this.stopPolling();
        this.showToast('Perjalanan selesai! Terima kasih.', 'success');
        setTimeout(() => this.router.navigate(['/tabs/beranda']), 2000);
      },
      error: () => {
        this.isCompleting = false;
        this.stopPolling();
        this.showToast('Perjalanan selesai! Terima kasih.', 'success');
        setTimeout(() => this.router.navigate(['/tabs/beranda']), 2000);
      }
    });
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────

  async confirmCancel() {
    const alert = await this.alertCtrl.create({
      header: 'Batalkan Pesanan?',
      message: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
      buttons: [
        { text: 'Tidak', role: 'cancel' },
        { text: 'Ya, Batalkan', cssClass: 'alert-btn-danger', handler: () => this.cancelOrder() }
      ]
    });
    await alert.present();
  }

  cancelOrder() {
    if (!this.order) return;
    this.isCancelling = true;
    this.orderService.cancelOrderByDriver(this.order.id).subscribe({
      next: () => { this.stopPolling(); this.isCancelling = false; this.showToast('Pesanan dibatalkan.', 'medium'); setTimeout(() => this.router.navigate(['/tabs/beranda']), 1500); },
      error: () => { this.isCancelling = false; this.stopPolling(); this.router.navigate(['/tabs/beranda']); }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getPhase(): 'accepted' | 'arrived' | 'started' | 'other' {
    const s = this.order?.status;
    if (s === 'accepted') return 'accepted';
    if (s === 'arrived') return 'arrived';
    if (s === 'started') return 'started';
    return 'other';
  }

  getCustomerPhoto(): string { return this.order?.customer?.photo || 'https://ionicframework.com/docs/img/demos/avatar.svg'; }
  getCustomerName(): string { return this.order?.customer?.name || 'Pelanggan'; }
  getCustomerRating(): string { const r = this.order?.customer?.rating; return r ? r.toFixed(1) : '4.8'; }
  formatPrice(price: number | null | undefined): string { if (!price) return 'Rp 0'; return 'Rp ' + price.toLocaleString('id-ID'); }
  getPaymentLabel(): string { const m = this.order?.payment_method || 'tunai'; return m === 'tunai' ? 'Tunai' : `Non Tunai : ${m}`; }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }
}
