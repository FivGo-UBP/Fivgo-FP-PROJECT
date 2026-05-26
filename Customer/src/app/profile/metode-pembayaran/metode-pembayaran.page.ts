import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-metode-pembayaran',
  templateUrl: './metode-pembayaran.page.html',
  styleUrls: ['./metode-pembayaran.page.scss'],
  standalone: false,
})
export class MetodePembayaranPage implements OnInit {

  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'Dana';
  showNonTunaiOptions: boolean = false;

  nonTunaiOptions: string[] = ['Dana', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja', 'QRIS', 'Virtual Account'];

  constructor() {}

  ngOnInit() {
    // Baca pilihan yang tersimpan sebelumnya
    const saved = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');
    if (saved) this.selectedPayment = saved;
    if (savedNonTunai) this.selectedNonTunai = savedNonTunai;
  }

  selectPayment(method: string) {
    this.selectedPayment = method;
    localStorage.setItem('selectedPayment', method);
    if (method !== 'nontunai') {
      this.showNonTunaiOptions = false;
    }
  }

  toggleNonTunai() {
    this.selectedPayment = 'nontunai';
    localStorage.setItem('selectedPayment', 'nontunai');
    this.showNonTunaiOptions = !this.showNonTunaiOptions;
  }

  selectNonTunai(opt: string) {
    this.selectedNonTunai = opt;
    this.selectedPayment = 'nontunai';
    localStorage.setItem('selectedNonTunai', opt);
    localStorage.setItem('selectedPayment', 'nontunai');
  }

  setUtama(method: string) {
    this.selectedPayment = method;
    localStorage.setItem('selectedPayment', method);
  }
}
