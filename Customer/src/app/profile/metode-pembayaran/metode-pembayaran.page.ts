import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-metode-pembayaran',
  templateUrl: './metode-pembayaran.page.html',
  styleUrls: ['./metode-pembayaran.page.scss'],
  standalone: false,
})
export class MetodePembayaranPage implements OnInit {

  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'QRIS_VA';

  constructor() {}

  ngOnInit() {
    // Baca pilihan yang tersimpan sebelumnya
    const saved = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');
    if (saved) this.selectedPayment = saved;
    if (savedNonTunai) this.selectedNonTunai = this.normalizePaymentCode(savedNonTunai);
    if (this.selectedPayment === 'nontunai') {
      this.persistNonTunai();
    }
  }

  selectPayment(method: string) {
    this.selectedPayment = method;
    localStorage.setItem('selectedPayment', method);
    if (method === 'nontunai') {
      this.persistNonTunai();
    }
  }

  toggleNonTunai() {
    this.selectPayment('nontunai');
  }

  setUtama(method: string) {
    this.selectPayment(method);
  }

  getSelectedNonTunaiLabel(): string {
    return 'QRIS/VA';
  }

  normalizePaymentCode(value: string): string {
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (['QRIS_VA', 'QRIS/VA', 'NON_TUNAI', 'NONTUNAI', 'DOMPETX'].includes(normalized)) {
      return 'QRIS_VA';
    }

    return 'QRIS_VA';
  }

  private persistNonTunai() {
    this.selectedNonTunai = 'QRIS_VA';
    localStorage.setItem('selectedPayment', 'nontunai');
    localStorage.setItem('selectedNonTunai', 'QRIS_VA');
  }
}
