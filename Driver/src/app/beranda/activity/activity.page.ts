import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService, OrderHistory } from '../../services/order.service';

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
    private orderService: OrderService
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

  applyFilter() {
    let result = [...this.allTrips];

    if (this.activeVehicle !== 'semua') {
      result = result.filter(t => t.vehicle_type?.toLowerCase() === this.activeVehicle.toLowerCase());
    }

    if (this.activeStatus !== 'semua') {
      const map: { [k: string]: string } = { 'Selesai': 'completed', 'Dibatalkan': 'cancelled' };
      result = result.filter(t => t.status === map[this.activeStatus]);
    }

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

    if (this.searchQuery) {
      result = result.filter(t => {
        return t.pickup_address.toLowerCase().includes(this.searchQuery) ||
               t.dropoff_address.toLowerCase().includes(this.searchQuery) ||
               (t.vehicle_type && t.vehicle_type.toLowerCase().includes(this.searchQuery));
      });
    }

    this.filteredTrips = result;
    this.buildGroups();
  }

  buildGroups() {
    const map = new Map<string, OrderHistory[]>();
    
    for (const trip of this.filteredTrips) {
      const d = new Date(trip.created_at);
      const label = d.toLocaleDateString('id-ID', {
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

  goToChatbot(trip: OrderHistory) {
    this.router.navigate(['/chatbot-bantuan'], {
      queryParams: { order_id: trip.id }
    });
  }

  formatPrice(price: number): string {
    return 'Rp. ' + price?.toLocaleString('id-ID');
  }

  formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    return `${datePart} • ${timePart}`;
  }
}
