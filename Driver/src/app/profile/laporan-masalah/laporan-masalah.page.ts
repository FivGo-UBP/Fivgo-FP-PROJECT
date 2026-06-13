import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-laporan-masalah',
  templateUrl: './laporan-masalah.page.html',
  styleUrls: ['./laporan-masalah.page.scss'],
  standalone: false,
})
export class LaporanMasalahPage implements OnInit {
  isLoading: boolean = false;
  laporanHistory: any[] = [];

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService
  ) { }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    try {
      const historyJson = localStorage.getItem('laporan_masalah_history') || '[]';
      this.laporanHistory = JSON.parse(historyJson).map((item: any) => ({
        ...item,
        isExpanded: false
      }));
    } catch (e) {
      console.error('Error loading report history:', e);
      this.laporanHistory = [];
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }

  reloadData() {
    this.isLoading = true;
    setTimeout(() => {
      this.loadHistory();
      this.isLoading = false;
    }, 1500); // 1.5s loading simulation
  }

  toggleExpand(index: number) {
    this.laporanHistory[index].isExpanded = !this.laporanHistory[index].isExpanded;
  }

  getCategoryTagClass(kategori: string): string {
    const k = kategori.toLowerCase();
    if (k.includes('keselamatan')) return 'tag-keamanan';
    if (k.includes('tertinggal')) return 'tag-barang';
    if (k.includes('penumpang')) return 'tag-penumpang';
    if (k.includes('pembayaran') || k.includes('bayar')) return 'tag-pembayaran';
    return 'tag-default';
  }

  getCategoryLabel(kategori: string): string {
    const k = kategori.toLowerCase();
    if (k.includes('keselamatan')) return 'Keselamatan';
    if (k.includes('tertinggal')) return 'Barang Tertinggal';
    if (k.includes('penumpang')) return 'Mitra Penumpang';
    if (k.includes('pembayaran') || k.includes('bayar')) return 'Pembayaran';
    return 'Bantuan';
  }

  getReportTitle(kategori: string): string {
    const match = kategori.match(/Order #([a-zA-Z0-9]+)/);
    if (match) {
      return `Pesanan #${match[1]}`;
    }
    return 'Laporan Masalah';
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  }

  formatDescription(deskripsi: string): string {
    if (!deskripsi) return '';
    return deskripsi
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
