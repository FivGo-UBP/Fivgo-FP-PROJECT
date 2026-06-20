import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Kirim form pengajuan driver (ganti foto, telepon, kendaraan)
   * Menggunakan FormData agar mendukung upload file
   */
  submitFormPengajuan(data: {
    jenis_pengajuan: string;
    nama: string;
    telepon: string;
    catatan?: string;
    telepon_lama?: string;
    telepon_baru?: string;
    tipe_kendaraan?: string;
    plat_kendaraan?: string;
    foto?: File | null;
    stnk?: File | null;
  }): Observable<any> {
    const formData = new FormData();
    formData.append('jenis_pengajuan', data.jenis_pengajuan);
    formData.append('nama', data.nama);
    formData.append('telepon', data.telepon);

    if (data.catatan) formData.append('catatan', data.catatan);
    if (data.telepon_lama) formData.append('telepon_lama', data.telepon_lama);
    if (data.telepon_baru) formData.append('telepon_baru', data.telepon_baru);
    if (data.tipe_kendaraan) formData.append('tipe_kendaraan', data.tipe_kendaraan);
    if (data.plat_kendaraan) formData.append('plat_kendaraan', data.plat_kendaraan);
    if (data.foto) formData.append('foto', data.foto);
    if (data.stnk) formData.append('stnk', data.stnk);

    return this.http.post<any>(`${this.apiUrl}/form-pengajuan`, formData);
  }

  /**
   * Kirim laporan masalah driver
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
