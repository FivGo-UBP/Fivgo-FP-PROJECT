import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-form-pengajuan',
  templateUrl: './form-pengajuan.page.html',
  styleUrls: ['./form-pengajuan.page.scss'],
  standalone: false,
})
export class FormPengajuanPage implements OnInit {
  pageTitle: string = 'Form Pengajuan';
  formType: string = '';
  showPassword: boolean = false;

  formData = {
    nama: '',
    email: '',
    telepon: '',
    password: '',
    alasan: '',
    catatan: ''
  };

  alasanList: string[] = [];

  alasanUpdate = [
    'Ganti Nomor Telepon',
    'Perbaikan Nama/Data Diri',
    'Update Dokumen/KTP/SIM',
    'Lainnya'
  ];

  alasanDelete = [
    'Berhenti menjadi driver',
    'Pindah ke platform lain',
    'Masalah privasi & keamanan data',
    'Pendapatan tidak sesuai harapan',
    'Masalah teknis yang tidak terselesaikan',
    'Lainnya'
  ];

  customPopoverOptions = {
    cssClass: 'full-width-popover'
  };

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.formType = params['type'];
        if (this.formType === 'update') {
          this.pageTitle = 'Update Akun';
          this.alasanList = this.alasanUpdate;
        } else if (this.formType === 'delete') {
          this.pageTitle = 'Hapus Akun';
          this.alasanList = this.alasanDelete;
        }
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  submitForm() {
    console.log('Form submitted:', this.formData, 'Type:', this.formType);
    // TODO: implement logic for API post
  }
}
