import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-form-telpon-login',
  templateUrl: './form-telpon-login.page.html',
  styleUrls: ['./form-telpon-login.page.scss'],
  standalone: false,
})
export class FormTelponLoginPage implements OnInit {
  phoneNumber: string = '';
  countryCode: string = '+62';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
  }

  validateNumber(event: any) {
    const value = event.target.value;
    this.phoneNumber = value.replace(/[^0-9]/g, '');
  }

  async onSubmit() {
    if (!this.phoneNumber) {
      this.showAlert('Error', 'Silakan masukkan nomor telepon Anda.');
      return;
    }

    // Format phone number, e.g., +628123456789
    let fullPhone = this.countryCode + this.phoneNumber;
    // Remove leading zero if present after country code (e.g. +620812 -> +62812)
    if (this.phoneNumber.startsWith('0')) {
      fullPhone = this.countryCode + this.phoneNumber.substring(1);
    }

    const loading = await this.loadingCtrl.create({
      message: 'Meminta OTP...',
    });
    await loading.present();

    this.authService.requestOtp(fullPhone, 'customer').subscribe({
      next: (res: any) => {
        loading.dismiss();
        localStorage.setItem(`otp_expires_at_customer_${fullPhone}`, String(Date.now() + (res.expired_in_seconds || 300) * 1000));
        // Pass phone to OTP page
        this.router.navigate(['/kode-otp-login'], {
          queryParams: { phone: fullPhone, role: 'customer', purpose: 'login' }
        });
      },
      error: (err: any) => {
        loading.dismiss();
        if (err.status === 404) {
          this.showAlert('Nomor Belum Terdaftar', 'Nomor belum terdaftar. Silakan daftar terlebih dahulu.');
          return;
        }

        this.showAlert('Gagal', err.error?.message || 'Terjadi kesalahan saat meminta OTP.');
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
