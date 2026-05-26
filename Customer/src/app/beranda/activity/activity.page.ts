import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderHistory } from '../../services/order.service';
import { LanguageService } from '../../services/language.service';

export interface TripGroup {
  date: string;
  trips: OrderHistory[];
}

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
  standalone: false,
})
export class ActivityPage implements OnInit {

  activeVehicle: string = 'semua';
  activeStatus: string = 'semua';
  activeTime: string = 'semua';
  searchQuery: string = '';

  allTrips: OrderHistory[] = [];
  filteredTrips: OrderHistory[] = [];
  groupedTrips: TripGroup[] = [];

  isLoading: boolean = true;
  hasError: boolean = false;

  constructor(
    private router: Router, 
    private orderService: OrderService,
    public langService: LanguageService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  ionViewWillEnter() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading = true;
    this.hasError = false;

    this.orderService.getHistory().subscribe({
      next: (res) => {
        this.allTrips = res.data;
        this.isLoading = false;
        this.applyFilter();
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }

  // ─── Setter filter ────────────────────────────────────────────────────────
  setVehicle(value: string) { this.activeVehicle = value; this.applyFilter(); }
  setStatus(value: string)  { this.activeStatus  = value; this.applyFilter(); }
  setTime(value: string)    { this.activeTime    = value; this.applyFilter(); }
  
  resetFilters() {
    this.activeVehicle = 'semua';
    this.activeStatus = 'semua';
    this.activeTime = 'semua';
    this.searchQuery = '';
    this.applyFilter();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.target.value?.toLowerCase() ?? '';
    this.applyFilter();
  }

  // ─── Filter logic ─────────────────────────────────────────────────────────
  applyFilter() {
    let result = [...this.allTrips];

    // Filter kendaraan
    if (this.activeVehicle !== 'semua') {
      result = result.filter(t => t.vehicle_type?.toLowerCase() === this.activeVehicle.toLowerCase());
    }

    // Filter status
    if (this.activeStatus !== 'semua') {
      const map: { [k: string]: string } = { 'Selesai': 'completed', 'Dibatalkan': 'cancelled' };
      result = result.filter(t => t.status === map[this.activeStatus]);
    }

    // Filter waktu
    if (this.activeTime !== 'semua') {
      const now = new Date();
      result = result.filter(t => {
        const d = new Date(t.created_at);
        if (this.activeTime === 'Hari ini') return d.toDateString() === now.toDateString();
        if (this.activeTime === 'Minggu ini') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return d >= startOfWeek;
        }
        if (this.activeTime === 'Bulan ini') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Filter pencarian
    if (this.searchQuery) {
      result = result.filter(t => {
        const translatedVehicle = this.getVehicleLabel(t.vehicle_type).toLowerCase();
        return t.pickup_address.toLowerCase().includes(this.searchQuery) ||
               t.dropoff_address.toLowerCase().includes(this.searchQuery) ||
               (t.vehicle_type && t.vehicle_type.toLowerCase().includes(this.searchQuery)) ||
               translatedVehicle.includes(this.searchQuery);
      });
    }

    this.filteredTrips = result;
    this.buildGroups();
  }

  buildGroups() {
    const map = new Map<string, OrderHistory[]>();
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    
    for (const trip of this.filteredTrips) {
      const d = new Date(trip.created_at);
      const label = d.toLocaleDateString(locale, {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(trip);
    }
    this.groupedTrips = Array.from(map.entries()).map(([date, trips]) => ({ date, trips }));
  }

  openDetail(trip: OrderHistory) {
    this.router.navigate(['/order-detail', trip.id]);
  }

  pesanLagi(trip: OrderHistory, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/order']);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  getStatusLabel(status: string): string {
    const map: { [k: string]: string } = {
      completed: this.t('activity.status.completed'),
      cancelled: this.t('activity.status.cancelled'),
      rejected: this.t('activity.status.rejected'),
    };
    return map[status] ?? status;
  }

  getVehicleLabel(v: string): string {
    return v?.toLowerCase() === 'mobil' ? this.t('activity.vehicle.car') : this.t('activity.vehicle.motor');
  }

  getVehicleIcon(v: string): string {
    return v?.toLowerCase() === 'mobil' ? 'car-outline' : 'bicycle-outline';
  }

  getTimeLabel(time: string): string {
    if (time === 'Hari ini') return this.t('activity.time.today');
    if (time === 'Minggu ini') return this.t('activity.time.week');
    if (time === 'Bulan ini') return this.t('activity.time.month');
    return time;
  }

  formatPrice(price: number): string {
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    return 'Rp ' + price?.toLocaleString(locale);
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
