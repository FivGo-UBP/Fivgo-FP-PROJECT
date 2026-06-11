import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { OrderService, OrderHistory } from '../../services/order.service';

type FilterType = 'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini';

@Component({
  selector: 'app-daftar-aktivitas',
  templateUrl: './daftar-aktivitas.page.html',
  styleUrls: ['./daftar-aktivitas.page.scss'],
  standalone: false,
})
export class DaftarAktivitasPage implements OnInit {

  allTrips: OrderHistory[] = [];
  filteredTrips: OrderHistory[] = [];
  isLoading: boolean = true;
  hasError: boolean = false;
  selectedFilter: FilterType = 'semua';

  constructor(
    private navCtrl: NavController,
    private orderService: OrderService
  ) { }

  ngOnInit() {
    this.loadTrips();
  }

  ionViewWillEnter() {
    this.loadTrips();
  }

  loadTrips() {
    this.isLoading = true;
    this.hasError = false;
    this.orderService.getHistory().subscribe({
      next: (res) => {
        // Hanya tampilkan order yang berhasil (completed)
        this.allTrips = (res.data || []).filter(t => t.status === 'completed');
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal memuat riwayat', err);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  setFilter(filter: FilterType) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedFilter === 'semua') {
      this.filteredTrips = [...this.allTrips];
      return;
    }

    const now = new Date();

    this.filteredTrips = this.allTrips.filter(trip => {
      const tripDate = new Date(trip.created_at);

      if (this.selectedFilter === 'hari_ini') {
        return (
          tripDate.getFullYear() === now.getFullYear() &&
          tripDate.getMonth() === now.getMonth() &&
          tripDate.getDate() === now.getDate()
        );
      }

      if (this.selectedFilter === 'minggu_ini') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return tripDate >= startOfWeek && tripDate <= endOfWeek;
      }

      if (this.selectedFilter === 'bulan_ini') {
        return (
          tripDate.getFullYear() === now.getFullYear() &&
          tripDate.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }

  formatPrice(price: number): string {
    return 'Rp' + (price || 0).toLocaleString('id-ID');
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }

  getVehicleLabel(type: string): string {
    if (!type) return 'Kendaraan';
    return type.toLowerCase() === 'mobil' ? 'FivGo Car' : 'FivGo Motor';
  }

  getStatusLabel(status: string): string {
    if (status === 'completed') return 'Selesai';
    if (status === 'cancelled') return 'Dibatalkan';
    return 'Ditolak';
  }

  openTripDetail(trip: OrderHistory) {
    this.navCtrl.navigateForward('/chatbot-bantuan', {
      queryParams: { order_id: trip.id }
    });
  }

  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }
}
