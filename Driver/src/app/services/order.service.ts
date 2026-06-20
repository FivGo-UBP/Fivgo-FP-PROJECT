import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface OrderCustomer {
  id: string;
  name: string;
  photo: string | null;
  phone?: string | null;
  rating?: number | null;
}

export interface ActiveOrder {
  id: string;
  status: 'payment_pending' | 'pending' | 'accepted' | 'arrived' | 'started' | 'completed' | 'cancelled' | 'rejected';
  vehicle_type: string | null;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_price: number;
  final_price: number | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  customer: OrderCustomer | null;
  driver: any | null;
}

export interface OrderHistory {
  id: string;
  status: 'completed' | 'cancelled' | 'rejected';
  vehicle_type: string;
  pickup_address: string;
  dropoff_address: string;
  final_price: number;
  payment_method: string;
  rating: number | null;
  review: string | null;
  created_at: string;
  customer: OrderCustomer | null;
}

export interface OrderDetail extends OrderHistory {
  estimated_price: number;
  cancel_reason: string | null;
}

export interface DriverPerformance {
  average_rating: number;
  total_reviews: number;
  sangat_puas: number;
  puas: number;
  perlu_ditingkatkan: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  // ─── Active Order ──────────────────────────────────────────────────────────

  getActiveOrder(): Observable<ActiveOrder | null> {
    return this.http.get<ActiveOrder | null>(`${environment.apiUrl}/orders/active`);
  }

  getOrderDetail(id: string): Observable<ActiveOrder> {
    return this.http.get<ActiveOrder>(`${environment.apiUrl}/orders/${id}`);
  }

  acceptOrder(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/accept`, {});
  }

  rejectOrder(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/reject`, {});
  }

  arrivedAtPickup(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/arrived`, {});
  }

  startOrder(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/start`, {});
  }

  completeOrder(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/complete`, {});
  }

  cancelOrderByDriver(id: string, reason?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/reject`, { reason });
  }

  // ─── Driver Status & Location ─────────────────────────────────────────────

  updateDriverStatus(status: 'online' | 'offline' | 'busy'): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/drivers/status`, { status });
  }

  updateDriverLocation(lat: number, lng: number, heading?: number, orderId?: string): Observable<any> {
    const payload: any = { lat, lng };
    if (heading !== undefined) payload.heading = heading;
    if (orderId !== undefined) payload.order_id = orderId;
    return this.http.post<any>(`${environment.apiUrl}/drivers/location`, payload);
  }

  // ─── History ──────────────────────────────────────────────────────────────

  getHistory(): Observable<{ data: OrderHistory[] }> {
    return this.http.get<{ data: OrderHistory[] }>(`${environment.apiUrl}/drivers/history`);
  }

  getHistoryDetail(id: string): Observable<{ data: OrderDetail }> {
    return this.http.get<{ data: OrderDetail }>(`${environment.apiUrl}/drivers/history/${id}`);
  }

  getDriverPerformance(): Observable<DriverPerformance> {
    return this.http.get<DriverPerformance>(`${environment.apiUrl}/drivers/performance`);
  }

  // ─── Wallet Endpoints ──────────────────────────────────────────────────────

  getWalletBalance(): Observable<{ balance: number; transactions: any[] }> {
    return this.http.get<{ balance: number; transactions: any[] }>(`${environment.apiUrl}/wallet/balance`);
  }

  initiateTopUp(amount: number, method: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/wallet/topup`, { amount, method });
  }

  withdraw(amount: number, bankName: string, accountNumber: string, accountName: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/wallet/withdraw`, {
      amount,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName
    });
  }

  reportCustomer(data: {
    customer_id: string;
    order_id: string;
    reason: string;
    description?: string;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/drivers/report-customer`, data);
  }
}
  