import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-kodeotp',
  templateUrl: './kodeotp.page.html',
  styleUrls: ['./kodeotp.page.scss'],
  standalone: false,
})
export class KodeotpPage implements OnInit, OnDestroy {
  phone: string = '';
  role: string = 'customer';
  purpose: 'login' | 'register' = 'register';
  otp: string = '';

  private readonly otpValiditySeconds = 300;
  private readonly resendCooldownSeconds = 60;

  // Timer properties
  otpTimeLeft: number = 300;
  resendTimeLeft: number = 0;
  isOtpExpired: boolean = false;
  private otpTimer: any;
  private resendTimer: any;

  // OTP attempt tracking
  invalidAttempts: number = 0;
  maxAttempts: number = 5;
  isLockedOut: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.phone = params['phone'];
        this.role = params['role'] || 'customer';
        this.purpose = params['purpose'] === 'register' ? 'register' : 'login';
        this.startOtpTimer();
        this.restoreResendTimer();
      }
    });
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  private getOtpStorageKey(): string {
    return `otp_expires_at_${this.role}_${this.phone}`;
  }

  private getResendStorageKey(): string {
    return `otp_resend_available_at_${this.role}_${this.phone}`;
  }

  private getSecondsLeft(targetTime: number): number {
    return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
  }

  startOtpTimer(reset: boolean = false) {
    let expiresAt = Number(localStorage.getItem(this.getOtpStorageKey()));

    if (reset || !expiresAt) {
      expiresAt = Date.now() + this.otpValiditySeconds * 1000;
      localStorage.setItem(this.getOtpStorageKey(), String(expiresAt));
    }

    this.otpTimeLeft = this.getSecondsLeft(expiresAt);
    this.isOtpExpired = this.otpTimeLeft <= 0;
    if (this.isOtpExpired) return;

    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpTimer = setInterval(() => {
      this.otpTimeLeft = this.getSecondsLeft(expiresAt);
      if (this.otpTimeLeft <= 0) {
        this.isOtpExpired = true;
        clearInterval(this.otpTimer);
      }
    }, 1000);
  }

  startResendTimer(reset: boolean = false) {
    let resendAvailableAt = Number(localStorage.getItem(this.getResendStorageKey()));

    if (reset || !resendAvailableAt) {
      resendAvailableAt = Date.now() + this.resendCooldownSeconds * 1000;
      localStorage.setItem(this.getResendStorageKey(), String(resendAvailableAt));
    }

    this.resendTimeLeft = this.getSecondsLeft(resendAvailableAt);
    if (this.resendTimeLeft <= 0) return;

    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendTimeLeft = this.getSecondsLeft(resendAvailableAt);
      if (this.resendTimeLeft <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  restoreResendTimer() {
    const resendAvailableAt = Number(localStorage.getItem(this.getResendStorageKey()));
    if (resendAvailableAt && this.getSecondsLeft(resendAvailableAt) > 0) {
      this.startResendTimer();
    }
  }

  clearTimers() {
    if (this.otpTimer) clearInterval(this.otpTimer);
    if (this.resendTimer) clearInterval(this.resendTimer);
  }

  clearOtpSession() {
    localStorage.removeItem(this.getOtpStorageKey());
    localStorage.removeItem(this.getResendStorageKey());
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  maskPhone(phone: string): string {
    if (!phone) return '';
    if (phone.length <= 4) return phone;
    const prefix = phone.substring(0, phone.length - 4);
    return prefix + ' ***';
  }

  onOtpChange(value: string) {
    const cleanOtp = String(value || '').replace(/[^\d]/g, '');
    if (cleanOtp.length === 4 && !this.isOtpExpired && !this.isLockedOut) {
      this.verifyOtp();
    }
  }

  async verifyOtp() {
    if (this.isOtpExpired) {
      await this.showAlert('Peringatan', 'Kode OTP sudah kadaluarsa. Silakan minta kode baru.');
      return;
    }

    if (this.isLockedOut) {
      await this.showAlert('Terlalu Banyak Percobaan', 'Anda telah mencoba terlalu banyak kali. Silakan minta kode OTP baru.');
      return;
    }

    const cleanOtp = String(this.otp || '').replace(/[^\d]/g, '');

    if (!cleanOtp || cleanOtp.length < 4) {
      await this.showAlert('Peringatan', 'Harap masukkan 4 digit kode OTP.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Memverifikasi...' });
    await loading.present();

    this.authService.verifyOtp(this.phone, this.role, cleanOtp, this.purpose).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        this.clearTimers();
        this.clearOtpSession();
        this.invalidAttempts = 0;
        await this.router.navigate(['/form-nama'], { queryParams: { phone: this.phone } });
      },
      error: async (err: any) => {
        await loading.dismiss();

        this.invalidAttempts++;
        const remainingAttempts = this.maxAttempts - this.invalidAttempts;

        if (this.invalidAttempts >= this.maxAttempts) {
          this.isLockedOut = true;
          await this.showAlert('Terlalu Banyak Percobaan', 'Anda telah mencoba 5 kali. Silakan minta kode OTP baru untuk mencoba lagi.');
          return;
        }

        let message = err.error?.message || 'Kode OTP salah.';
        if (remainingAttempts <= 2) {
          message += ` Anda memiliki ${remainingAttempts} percobaan lagi.`;
        }
        await this.showAlert(err.status === 409 ? 'Nomor Sudah Terdaftar' : 'Kode OTP Salah', message);
      }
    });
  }

  async resendOtp() {
    if (this.resendTimeLeft > 0) {
      await this.showAlert('Peringatan', `Silakan tunggu ${this.resendTimeLeft} detik sebelum mengirim ulang OTP.`);
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Mengirim ulang OTP...' });
    await loading.present();

    this.authService.requestOtp(this.phone, this.role, this.purpose).subscribe({
      next: async () => {
        await loading.dismiss();
        this.startOtpTimer(true);
        this.startResendTimer(true);
        this.invalidAttempts = 0;
        this.isLockedOut = false;
        this.otp = '';
        await this.showAlert('Sukses', 'Kode OTP baru telah dikirim.');
      },
      error: async (err: any) => {
        await loading.dismiss();
        await this.showAlert('Gagal', err.error?.message || 'Gagal mengirim ulang OTP.');
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
