import { Component, OnInit, OnDestroy, AfterViewInit, NgZone } from '@angular/core';
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
  isPageActive: boolean = true;
  orderId: string = '';
  order: ActiveOrder | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;

  isArriving: boolean = false;
  isStarting: boolean = false;
  isCompleting: boolean = false;
  isCancelling: boolean = false;

  isCancelModalOpen: boolean = false;
  selectedCancelReason: string = '';
  customCancelReason: string = '';
  cancelReasons: string[] = [
    'Kendaraan mengalami kendala/ban bocor',
    'Pelanggan tidak bisa di hubungi',
    'Titik jemput terlalu jauh/tidak sesuai',
    'Pelanggan meminta pembatalan lewat chat',
    'ada situasi darurt/mendesak',
    'Alasan Lainnya'
  ];

  private map: any = null;
  private driverMarker: any = null;
  private driverAnimationId: any = null;
  private pickupMarker: any = null;
  private dropoffMarker: any = null;
  private mapReady: boolean = false;
  private watchId: string | null = null;

  private lastDriverLat: number | null = null;
  private lastDriverLng: number | null = null;
  private lastDriverHeading: number = 0;
  private lastRouteUpdate: number = 0;

  currentInstruction: string = '';
  instructionDistance: string = '';
  private navigationInstructions: any[] = [];

  private pollingInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private tomtomService: TomtomService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) {
      this.isLoading = false;
      this.hasError = true;
    }
  }

  ngAfterViewInit() {
    this.initMap();
    if (this.orderId) this.loadOrder();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.stopNavigationTracking();
    this.clearDriverMarker();
    if (this.map) { this.map.remove(); this.map = null; }
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
    this.isPageActive = true;
  }

  ionViewDidEnter() {
    if (this.map) {
      setTimeout(() => this.map.resize(), 100);
      setTimeout(() => this.map.resize(), 300);
      setTimeout(() => this.map.resize(), 500);
    }
  }

  ionViewWillLeave() {
    this.isPageActive = false;
  }

  loadOrder() {
    this.isLoading = true;
    this.orderService.getOrderDetail(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
        if (order) {
          this.startPolling();
          if (this.mapReady) {
            this.setupMapForOrder(order);
          }
        }
      },
      error: () => { this.isLoading = false; this.hasError = true; }
    });
  }

  async initMap() {
    if (!mapboxgl) return;
    if (this.map) {
      setTimeout(() => this.map.resize(), 100);
      return;
    }

    // Parallel fetch of actual GPS coordinates FIRST to avoid jumping from Jakarta
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: 3000 });
      this.lastDriverLat = pos.coords.latitude;
      this.lastDriverLng = pos.coords.longitude;
    } catch (e) {
      console.warn('GPS tidak tersedia atau timeout untuk penentuan posisi awal:', e);
    }

    // Default coordinates (Jakarta) as fallback
    let initLat = this.lastDriverLat !== null ? this.lastDriverLat : -6.175392;
    let initLng = this.lastDriverLng !== null ? this.lastDriverLng : 106.827153;

    const container = document.getElementById('driver-active-map');
    if (!container) {
      setTimeout(() => this.initMap(), 50);
      return;
    }

    mapboxgl.accessToken = environment.mapboxApiKey;
    this.map = new mapboxgl.Map({
      container: 'driver-active-map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initLng, initLat],
      zoom: 14,
      padding: { top: 120, bottom: 280, left: 40, right: 40 }
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    this.map.on('load', () => {
      this.mapReady = true;
      setTimeout(() => { if (this.map) this.map.resize(); }, 100);
      setTimeout(() => { if (this.map) this.map.resize(); }, 300);
      setTimeout(() => { if (this.map) this.map.resize(); }, 500);
      
      if (this.order) {
        this.setupMapForOrder(this.order);
      }
    });

    // Additional resize triggers
    setTimeout(() => { if (this.map) this.map.resize(); }, 600);
    setTimeout(() => { if (this.map) this.map.resize(); }, 1000);

    this.startNavigationTracking();
  }

  setupMapForOrder(order: ActiveOrder) {
    if (!this.map || !this.mapReady) return;

    const pickupLat = parseFloat(order.pickup_lat as any);
    const pickupLng = parseFloat(order.pickup_lng as any);

    const finalDriverLat = this.lastDriverLat !== null ? this.lastDriverLat : (pickupLat - 0.005);
    const finalDriverLng = this.lastDriverLng !== null ? this.lastDriverLng : (pickupLng - 0.005);

    // Reset markers if they already exist
    this.clearDriverMarker();
    if (this.pickupMarker) { this.pickupMarker.remove(); this.pickupMarker = null; }
    if (this.dropoffMarker) { this.dropoffMarker.remove(); this.dropoffMarker = null; }

    this.addMarkers(finalDriverLat, finalDriverLng, pickupLat, pickupLng, order);
    if (order.status === 'started') {
      this.updateMapForStartedPhase(order);
    } else {
      this.drawRouteTomTom(finalDriverLat, finalDriverLng, pickupLat, pickupLng, order.vehicle_type || 'motor', 'accepted');
    }
  }

  // Menggunakan TomTom API — rute SAMA PERSIS dengan yang ditampilkan di aplikasi customer
  drawRouteTomTom(fromLat: number, fromLng: number, toLat: number, toLng: number, vehicleType: string, phase: string, shouldFitBounds: boolean = true) {
    if (!this.isPageActive) return;
    this.tomtomService.calculateRoute(fromLat, fromLng, toLat, toLng, vehicleType).subscribe({
      next: (res: any) => {
        if (!res.routes || res.routes.length === 0 || !this.map) return;

        const routeData = this.selectPreferredRoute(res.routes);
        if (!routeData) return;

        const routePoints = routeData.legs[0].points;
        // TomTom mengembalikan {latitude, longitude}, Mapbox butuh [lng, lat]
        const coordinates: [number, number][] = routePoints.map((p: any) => [p.longitude, p.latitude]);

        // Hapus layer/source lama
        if (this.map.getLayer('route-layer')) this.map.removeLayer('route-layer');
        if (this.map.getSource('route')) this.map.removeSource('route');

        // Warna rute: Samakan dengan aplikasi customer (selalu oranye)
        const routeColor = '#FF9800';

        this.map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }
        });

        this.map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': routeColor, 'line-width': 5, 'line-opacity': 1 }
        });

        // Fit peta agar seluruh rute terlihat saat pertama kali, 
        // tapi nanti akan di-override oleh easeTo dari watchPosition
        if (shouldFitBounds) {
          const bounds = coordinates.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
          );
          this.map.fitBounds(bounds, {
            padding: { top: 120, bottom: 260, left: 40, right: 40 },
            maxZoom: 15 // Mencegah zoom-in ekstrim saat posisi sangat dekat
          });
        }

        // Simpan instruksi turn-by-turn jika ada
        if (routeData.guidance && routeData.guidance.instructions) {
          this.navigationInstructions = routeData.guidance.instructions;
          this.updateNavigationInstruction(fromLat, fromLng);
        }
      },
      error: (err) => console.error('TomTom routing error:', err)
    });
  }

  addMarkers(driverLat: number, driverLng: number, pickupLat: number, pickupLng: number, order: ActiveOrder) {
    // Marker titik penjemputan (Titik Biru dengan Animasi Kedap-Kedip seperti Customer App)
    const pickupEl = document.createElement('div');
    pickupEl.className = 'marker user-location-pulse';
    pickupEl.style.backgroundColor = '#007AFF';
    pickupEl.style.width = '22px';
    pickupEl.style.height = '22px';
    pickupEl.style.borderRadius = '50%';
    pickupEl.style.border = '3px solid #ffffff';
    pickupEl.style.boxShadow = '0 0 10px rgba(0, 122, 255, 0.6)';
    pickupEl.style.position = 'relative';

    // Efek Kedap Kedip (Pulsing Halo)
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
    pickupEl.appendChild(pulse);

    // Tambahkan style keyframe dinamis jika belum ada di dokumen
    if (!document.getElementById('pulse-gps-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-gps-style';
      style.innerHTML = `
        @keyframes pulseGps {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    this.pickupMarker = new mapboxgl.Marker({ element: pickupEl, anchor: 'center' })
      .setLngLat([pickupLng, pickupLat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${order.pickup_address}</strong>`))
      .addTo(this.map);

    // Set z-index titik biru di bawah motor
    const pickupElem = this.pickupMarker.getElement();
    if (pickupElem) {
      pickupElem.style.zIndex = '10';
    }

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

    // Set z-index motor di atas titik biru
    const driverElem = this.driverMarker.getElement();
    if (driverElem) {
      driverElem.style.zIndex = '100';
    }
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

    // Set z-index dropoff di bawah motor
    const dropElem = this.dropoffMarker.getElement();
    if (dropElem) {
      dropElem.style.zIndex = '10';
    }
  }

  updateMapForStartedPhase(order: ActiveOrder) {
    if (!this.map || !this.mapReady) return;

    const pickupLat = parseFloat(order.pickup_lat as any);
    const pickupLng = parseFloat(order.pickup_lng as any);
    const dropLat = parseFloat(order.dropoff_lat as any);
    const dropLng = parseFloat(order.dropoff_lng as any);

    if (!dropLat || !dropLng) return;

    // Pindahkan driver ke titik awal penjemputan (atau lokasi riil driver jika ada) saat sudah started
    const finalDriverLat = this.lastDriverLat !== null ? this.lastDriverLat : pickupLat;
    const finalDriverLng = this.lastDriverLng !== null ? this.lastDriverLng : pickupLng;

    if (this.driverMarker) {
      this.animateDriverMarker(finalDriverLng, finalDriverLat, this.lastDriverHeading);
    }

    // Tambah marker tujuan
    this.addDropoffMarker(order);

    // Gambar rute dari lokasi driver saat ini ke tujuan (TomTom, fase 'started')
    this.drawRouteTomTom(finalDriverLat, finalDriverLng, dropLat, dropLng, order.vehicle_type || 'motor', 'started');
  }

  async startNavigationTracking() {
    try {
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }
      if (perm.location !== 'granted') {
        console.warn('[DriverDebug] Location permission not granted');
        return;
      }
    } catch (e) {
      console.error('[DriverDebug] Error checking location permissions:', e);
    }

    this.watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 },
      (position, err) => {
        if (err) {
          console.warn('[DriverDebug] Geolocation watchPosition error:', err);
        }
        if (!position || err) return;

        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        const heading = position.coords.heading || 0; // Arah hadap device (0-360)

        // Simpan koordinat GPS terakhir untuk mencegah race condition peta belum dimuat
        this.lastDriverLat = lat;
        this.lastDriverLng = lng;
        this.lastDriverHeading = heading;

        // Update lokasi driver ke backend agar customer app bisa melakukan tracking
        this.orderService.updateDriverLocation(lat, lng, heading, this.orderId).subscribe({
          error: (err) => console.error('[DriverDebug] Gagal sinkronisasi lokasi ke server:', err)
        });

        // Rute dinamis tidak lagi digambar ulang setiap 5 detik agar jalur tidak melompat-lompat.
        // Rute hanya digambar saat pertama kali masuk halaman atau saat fase order berubah (di fungsi lain).

        // Jika peta belum siap atau halaman tidak aktif, jangan perbarui tampilan peta/instruksi
        if (!this.map || !this.mapReady || !this.isPageActive) return;

        this.zone.run(() => {
          // Pindahkan marker driver secara halus
          this.animateDriverMarker(lng, lat, heading);

          // Animasi Mapbox mengikuti pergerakan driver (flat, utara di atas seperti customer)
          // Menghilangkan paksaan zoom agar tingkat zoom rute dari fitBounds tetap dipertahankan
          // Ditambahkan padding bottom agar posisi driver bergeser ke atas (tidak tertutup bottom card)
          this.map.easeTo({
            center: [lng, lat],
            bearing: 0,
            pitch: 0,
            padding: { bottom: 280 },
            duration: 1000
          });

          this.updateNavigationInstruction(lat, lng);
        });
      }
    );
  }

  async stopNavigationTracking() {
    if (this.watchId != null) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
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

    const duration = 1500; // Durasi animasi 1.5 detik
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

  updateNavigationInstruction(lat: number, lng: number) {
    if (!this.navigationInstructions || this.navigationInstructions.length === 0) return;

    let closestDist = Infinity;
    let closestInstruction = null;

    for (const inst of this.navigationInstructions) {
      const pLat = inst.point.latitude;
      const pLng = inst.point.longitude;
      // Rumus estimasi jarak dalam meter
      const dLat = (pLat - lat) * 111000;
      const dLng = (pLng - lng) * 111000 * Math.cos(lat * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      // Cari poin instruksi di depan yang paling dekat (abaikan yang sudah terlewat jauh di belakang)
      if (dist < closestDist) {
        closestDist = dist;
        closestInstruction = inst;
      }
    }

    if (closestInstruction) {
      this.currentInstruction = closestInstruction.message;
      this.instructionDistance = closestDist > 1000 
        ? (closestDist / 1000).toFixed(1) + ' km' 
        : Math.round(closestDist) + ' m';
    }
  }

  startPolling() {
    this.stopPolling(); // Pastikan interval sebelumnya dihapus
    this.pollingInterval = setInterval(() => {
      this.orderService.getOrderDetail(this.orderId).subscribe({
        next: (order) => {
          if (!order) {
            this.stopPolling();
            this.zone.run(() => {
              this.router.navigate(['/tabs/beranda']);
            });
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
            setTimeout(() => this.zone.run(() => this.router.navigate(['/tabs/beranda'])), 2000);
          } else if (order.status === 'cancelled') {
            this.stopPolling();
            this.showToast('Pelanggan membatalkan pesanan ini. Jangan khawatir, performa akunmu dijamin tetap aman kok. Yuk, siap terima orderan lagi!.', 'danger');
            setTimeout(() => this.zone.run(() => this.router.navigate(['/tabs/beranda'])), 5000);
          }
        },
        error: (err) => console.error('Polling error:', err)
      });
    }, 3000); // Polling setiap 3 detik agar sangat responsif dan instan
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
        }
        this.showToast('Status: Sudah di titik penjemputan', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isArriving = false;
        if (this.order) {
          this.order.status = 'arrived';
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
        this.showToast('Pelanggan sudah bersama driver. Perjalanan dimulai!', 'success');
      },
      error: (err) => {
        console.error(err);
        this.isStarting = false;
        if (this.order) {
          this.order.status = 'started';
          this.updateMapForStartedPhase(this.order);
        }
        this.showToast('Pelanggan sudah bersama driver. Perjalanan dimulai!', 'success');
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
        setTimeout(() => this.router.navigate(['/order-summary', this.order!.id]), 2000);
      },
      error: () => {
        this.isCompleting = false;
        this.stopPolling();
        this.showToast('Perjalanan selesai! Terima kasih.', 'success');
        setTimeout(() => this.router.navigate(['/order-summary', this.order!.id]), 2000);
      }
    });
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────

  async confirmCancel() {
    this.selectedCancelReason = '';
    this.customCancelReason = '';
    this.isCancelModalOpen = true;
  }

  closeCancelModal() {
    this.isCancelModalOpen = false;
  }

  selectCancelReason(reason: string) {
    this.selectedCancelReason = reason;
  }

  getCancelState(): 1 | 2 | 3 {
    if (this.getPhase() === 'accepted') {
      return 1;
    }
    const count = Number(localStorage.getItem('driverCancelCount') || '4');
    if (count >= 5) {
      return 3;
    }
    return 2;
  }

  getCancelCount(): number {
    if (this.getPhase() === 'accepted') {
      return Number(localStorage.getItem('driverCancelCount') || '2');
    }
    return Number(localStorage.getItem('driverCancelCount') || '4');
  }

  cancelOrder() {
    if (!this.order) return;
    this.isCancelling = true;

    // Simulasikan pertambahan counter pembatalan harian driver
    const currentCount = this.getCancelCount();
    localStorage.setItem('driverCancelCount', String(Math.min(5, currentCount + 1)));

    const finalReason = this.selectedCancelReason === 'Alasan Lainnya' ? this.customCancelReason : this.selectedCancelReason;

    this.orderService.cancelOrderByDriver(this.order.id, finalReason).subscribe({
      next: () => {
        this.stopPolling();
        this.isCancelling = false;
        this.isCancelModalOpen = false;
        this.showToast('Pesanan dibatalkan.', 'medium');
        setTimeout(() => this.router.navigate(['/tabs/beranda']), 1500);
      },
      error: () => {
        this.isCancelling = false;
        this.isCancelModalOpen = false;
        this.stopPolling();
        this.router.navigate(['/tabs/beranda']);
      }
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

  getCustomerPhoto(): string { return this.order?.customer?.photo || 'assets/Profile-Default.jpeg'; }
  getCustomerName(): string { return this.order?.customer?.name || 'Pelanggan'; }
  getCustomerRating(): string { 
    const r = this.order?.customer?.rating; 
    if (!r) return '4.8';
    return typeof r === 'number' ? r.toFixed(1) : parseFloat(r as any).toFixed(1);
  }
  formatPrice(price: number | null | undefined): string { if (!price) return 'Rp 0'; return 'Rp ' + price.toLocaleString('id-ID'); }
  getPaymentLabel(): string { const m = this.order?.payment_method || 'tunai'; return m === 'tunai' ? 'Tunai' : `Non Tunai : ${this.formatPaymentMethod(m)}`; }

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

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await toast.present();
  }

  goToChat() {
    if (this.orderId) {
      this.router.navigate(['/tabs/pesan'], { queryParams: { order_id: this.orderId } });
    }
  }
}
