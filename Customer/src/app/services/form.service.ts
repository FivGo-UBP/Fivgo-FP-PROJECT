import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Kirim laporan masalah customer
   */
  submitLaporanMasalah(data: {
    nama: string;
    telepon: string;
    kategori: string;
    deskripsi: string;
    type?: string;
    reporter_role?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/laporan-masalah`, data);
  }
}
