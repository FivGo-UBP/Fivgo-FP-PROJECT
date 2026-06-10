import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, LoadingController } from '@ionic/angular';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-form-pengajuan',
  templateUrl: './form-pengajuan.page.html',
  styleUrls: ['./form-pengajuan.page.scss'],
  standalone: false,
})
export class FormPengajuanPage implements OnInit {
  pageTitle: string = 'Form Pengajuan';
  formType: string = '';
  selectedOption: string = '';
  showPassword: boolean = false;
  fotoFileName: string = '';
  stnkFileName: string = '';
  isSubmitting: boolean = false;

  // Menyimpan File object asli untuk dikirim ke API
  fotoFile: File | null = null;
  stnkFile: File | null = null;

  formData = {
    nama: '',
    email: '',
    telepon: '',
    teleponLama: '',
    teleponBaru: '',
    tipeKendaraan: '',
    platKendaraan: '',
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

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private formService: FormService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.formType = params['type'];
        if (this.formType === 'update') {
          this.pageTitle = 'Update Akun';
          this.alasanList = this.alasanUpdate;

          if (params['option']) {
            this.selectedOption = params['option'];
            if (this.selectedOption === 'foto') {
              this.pageTitle = 'Ganti Foto Profil';
            } else if (this.selectedOption === 'telepon') {
              this.pageTitle = 'Ganti Nomor Telepon';
            } else if (this.selectedOption === 'kendaraan') {
              this.pageTitle = 'Ganti Kendaraan';
            }
          }
        } else if (this.formType === 'delete') {
          this.pageTitle = 'Hapus Akun';
          this.alasanList = this.alasanDelete;
        }
      }
    });
  }

  goBack() {
    this.navCtrl.navigateBack('/keamanan');
  }

  onFileSelected(event: Event, type: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (type === 'foto') {
        this.fotoFileName = file.name;
        this.fotoFile = file;
      } else if (type === 'stnk') {
        this.stnkFileName = file.name;
        this.stnkFile = file;
      }
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isSubmitDisabled(): boolean {
    if (this.isSubmitting) return true;

    if (this.formType === 'delete') {
      return !this.formData.nama || !this.formData.telepon || !this.formData.password || !this.formData.alasan || (this.formData.alasan === 'Lainnya' && !this.formData.catatan);
    }

    if (this.selectedOption === 'foto') {
      return !this.formData.nama || !this.formData.telepon || !this.fotoFile;
    }
    if (this.selectedOption === 'telepon') {
      return !this.formData.nama || !this.formData.teleponLama || !this.formData.teleponBaru;
    }
    if (this.selectedOption === 'kendaraan') {
      return !this.formData.nama || !this.formData.telepon || !this.formData.tipeKendaraan || !this.formData.platKendaraan || !this.stnkFile;
    }

    return !this.formData.nama || !this.formData.email || !this.formData.telepon || !this.formData.alasan || (this.formData.alasan === 'Lainnya' && !this.formData.catatan);
  }

  async submitForm() {
    if (this.isSubmitDisabled()) return;

    const loading = await this.loadingCtrl.create({
      message: 'Mengirim pengajuan...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isSubmitting = true;

    this.formService.submitFormPengajuan({
      jenis_pengajuan: this.selectedOption || 'update',
      nama: this.formData.nama,
      telepon: this.formData.telepon || this.formData.teleponLama,
      catatan: this.formData.catatan,
      telepon_lama: this.formData.teleponLama,
      telepon_baru: this.formData.teleponBaru,
      tipe_kendaraan: this.formData.tipeKendaraan,
      plat_kendaraan: this.formData.platKendaraan,
      foto: this.fotoFile,
      stnk: this.stnkFile,
    }).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.isSubmitting = false;
        await this.showToast(res.message || 'Pengajuan berhasil dikirim!', 'success');
        this.navCtrl.navigateBack('/keamanan');
      },
      error: async (err) => {
        await loading.dismiss();
        this.isSubmitting = false;
        const msg = err?.error?.message || 'Gagal mengirim pengajuan. Coba lagi.';
        await this.showToast(msg, 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
