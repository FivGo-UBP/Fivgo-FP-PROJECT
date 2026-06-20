import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface OrderDriver {
  id: string;
  name: string;
  photo: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
  vehicle_brand?: string | null;
  rating: number | null;
  phone?: string | null;
  current_lat?: number | null;
  current_lng?: number | null;
  heading?: number | null;
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
  discount_amount?: number | null;
  promo_code?: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  customer: any | null;
  driver: OrderDriver | null;
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
  driver: OrderDriver | null;
}

export interface OrderDetail extends OrderHistory {
  estimated_price: number;
  cancel_reason: string | null;
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  method: string;
  gateway: string | null;
  total_amount: number;
  status: string;
  transaction_id: string | null;
  gateway_payload?: any;
  expires_at?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  // ─── Active Order ──────────────────────────────────────────────────────────

  createOrder(data: {
    pickup_address: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_address: string;
    dropoff_lat: number;
    dropoff_lng: number;
    payment_method: string;
    vehicle_type: string;
    notes?: string;
    estimated_price?: number;
    promo_code?: string;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders`, data);
  }

  getActiveOrder(): Observable<ActiveOrder | null> {
    return this.http.get<ActiveOrder | null>(`${environment.apiUrl}/orders/active`);
  }

  cancelOrder(id: string, reason: string = 'Customer cancelled'): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/cancel`, { reason });
  }

  retryOrder(id: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/retry`, {});
  }

  createPayment(data: {
    order_id: string;
    method: string;
    amount: number;
  }): Observable<PaymentRecord> {
    return this.http.post<PaymentRecord>(`${environment.apiUrl}/payments/pre-auth`, data);
  }

  getPaymentStatus(orderId: string): Observable<PaymentRecord> {
    return this.http.get<PaymentRecord>(`${environment.apiUrl}/payments/${orderId}`);
  }

  rateOrder(id: string, rating: number, review: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/orders/${id}/rating`, { rating, review });
  }

  // ─── Promo ──────────────────────────────────────────────────────────────────

  getPromos(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/promos`);
  }

  applyPromo(code: string, amount: number, vehicleType: string, paymentMethod: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/promos/apply`, {
      code,
      order_amount: amount,
      vehicle_type: vehicleType,
      payment_method: paymentMethod
    });
  }

  // ─── History ──────────────────────────────────────────────────────────────

  getHistory(): Observable<{ data: OrderHistory[] }> {
    return this.http.get<{ data: OrderHistory[] }>(`${environment.apiUrl}/customers/history`);
  }

  getHistoryDetail(id: string): Observable<{ data: OrderDetail }> {
    return this.http.get<{ data: OrderDetail }>(`${environment.apiUrl}/customers/history/${id}`);
  }

  // ─── Wallet Endpoints ──────────────────────────────────────────────────────

  getWalletBalance(): Observable<{ balance: number; transactions: any[] }> {
    return this.http.get<{ balance: number; transactions: any[] }>(`${environment.apiUrl}/wallet/balance`);
  }

  initiateTopUp(amount: number, method: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/wallet/topup`, { amount, method });
  }

  reportDriver(data: {
    driver_id: string;
    order_id: string;
    reason: string;
    description?: string;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/customers/report-driver`, data);
  }
}
