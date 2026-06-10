import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-laporan-masalah',
  templateUrl: './laporan-masalah.page.html',
  styleUrls: ['./laporan-masalah.page.scss'],
  standalone: false,
})
export class LaporanMasalahPage implements OnInit {
  isLoading: boolean = false;
  isSuccess: boolean = false;

  formData = {
    nama: '',
    telepon: '',
    kategori: '',
    deskripsi: ''
  };

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService,
    private formService: FormService
  ) { }

  ngOnInit() { }

  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }

  isSubmitDisabled(): boolean {
    return !this.formData.nama ||
           !this.formData.telepon ||
           !this.formData.kategori ||
           !this.formData.deskripsi;
  }

  submitForm() {
    if (this.isSubmitDisabled()) return;

    this.isLoading = true;

    this.formService.submitLaporanMasalah({
      nama: this.formData.nama,
      telepon: this.formData.telepon,
      kategori: this.formData.kategori,
      deskripsi: this.formData.deskripsi,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err?.error?.message || 'Gagal mengirim laporan. Periksa koneksi Anda dan coba lagi.';
        alert(msg);
      }
    });
  }

  resetForm() {
    this.isSuccess = false;
    this.formData = { nama: '', telepon: '', kategori: '', deskripsi: '' };
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
