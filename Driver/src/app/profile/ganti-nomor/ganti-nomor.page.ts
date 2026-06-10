import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertController, LoadingController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-ganti-nomor',
  templateUrl: './ganti-nomor.page.html',
  styleUrls: ['./ganti-nomor.page.scss'],
  standalone: false,
})
export class GantiNomorPage implements OnInit, OnDestroy {
  // Step 1: Input nomor baru
  // Step 2: Verifikasi OTP
  step: 1 | 2 = 1;

  newPhone: string = '';
  otp: string = '';
  role: string = 'driver';

  // Timer
  private readonly otpValiditySeconds = 300;
  private readonly resendCooldownSeconds = 60;
  otpTimeLeft: number = 300;
  resendTimeLeft: number = 0;
  isOtpExpired: boolean = false;
  private otpTimer: any;
  private resendTimer: any;

  // Attempt tracking
  invalidAttempts: number = 0;
  maxAttempts: number = 5;
  isLockedOut: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  goBack() {
    this.navCtrl.navigateBack('/edit-profile');
  }

  ngOnInit() {
    const user = this.authService.currentUserValue;
    if (user?.role) {
      this.role = user.role;
    }
  }

  ngOnDestroy() {
    this.clearTimers();
  }

  // ─── Timer helpers ────────────────────────────────────────────────
  private storageKey(type: 'otp' | 'resend') {
    return `phone_change_${type}_${this.role}_${this.newPhone}`;
  }

  private getSecondsLeft(target: number): number {
    return Math.max(0, Math.ceil((target - Date.now()) / 1000));
  }

  startOtpTimer(reset = false) {
    let expiresAt = Number(localStorage.getItem(this.storageKey('otp')));
    if (reset || !expiresAt) {
      expiresAt = Date.now() + this.otpValiditySeconds * 1000;
      localStorage.setItem(this.storageKey('otp'), String(expiresAt));
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

  startResendTimer(reset = false) {
    let resendAt = Number(localStorage.getItem(this.storageKey('resend')));
    if (reset || !resendAt) {
      resendAt = Date.now() + this.resendCooldownSeconds * 1000;
      localStorage.setItem(this.storageKey('resend'), String(resendAt));
    }
    this.resendTimeLeft = this.getSecondsLeft(resendAt);
    if (this.resendTimeLeft <= 0) return;

    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendTimeLeft = this.getSecondsLeft(resendAt);
      if (this.resendTimeLeft <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }

  clearTimers() {
    if (this.otpTimer) clearInterval(this.otpTimer);
    if (this.resendTimer) clearInterval(this.resendTimer);
  }

  clearOtpSession() {
    localStorage.removeItem(this.storageKey('otp'));
    localStorage.removeItem(this.storageKey('resend'));
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length <= 4) return phone;
    return phone.substring(0, phone.length - 4) + ' ***';
  }

  // ─── Step 1: Kirim OTP ke nomor baru ──────────────────────────────
  async requestOtp() {
    if (!this.newPhone || this.newPhone.length < 9) {
      await this.showAlert('Peringatan', 'Masukkan nomor telepon yang valid.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Mengirim OTP...' });
    await loading.present();

    this.authService.requestPhoneChangeOtp(this.newPhone).subscribe({
      next: async () => {
        await loading.dismiss();
        this.step = 2;
        this.otp = '';
        this.invalidAttempts = 0;
        this.isLockedOut = false;
        this.isOtpExpired = false;
        this.startOtpTimer(true);
        this.startResendTimer(true);
      },
      error: async (err: any) => {
        await loading.dismiss();
        const msg = err.error?.message || 'Gagal mengirim OTP. Coba lagi.';
        await this.showAlert('Gagal', msg);
      }
    });
  }

  // ─── Step 2: Kirim ulang OTP ──────────────────────────────────────
  async resendOtp() {
    if (this.resendTimeLeft > 0) {
      await this.showAlert('Peringatan', `Tunggu ${this.resendTimeLeft} detik sebelum kirim ulang.`);
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Mengirim ulang OTP...' });
    await loading.present();

    this.authService.requestPhoneChangeOtp(this.newPhone).subscribe({
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

  // ─── Step 2: Verifikasi OTP & update nomor ────────────────────────
  async verifyAndChange() {
    if (this.isOtpExpired) {
      await this.showAlert('Peringatan', 'Kode OTP sudah kadaluarsa. Silakan kirim ulang.');
      return;
    }
    if (this.isLockedOut) {
      await this.showAlert('Terlalu Banyak Percobaan', 'Minta kode OTP baru untuk mencoba lagi.');
      return;
    }

    const cleanOtp = String(this.otp || '').replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length < 4) {
      await this.showAlert('Peringatan', 'Masukkan 4 digit kode OTP.');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Memverifikasi...' });
    await loading.present();

    this.authService.changePhone(this.newPhone, cleanOtp).subscribe({
      next: async () => {
        await loading.dismiss();
        this.clearTimers();
        this.clearOtpSession();
        await this.showAlert('Berhasil', 'Nomor telepon berhasil diperbarui.');
        this.navCtrl.navigateBack('/edit-profile');
      },
      error: async (err: any) => {
        await loading.dismiss();
        this.invalidAttempts++;
        const remaining = this.maxAttempts - this.invalidAttempts;

        if (this.invalidAttempts >= this.maxAttempts) {
          this.isLockedOut = true;
          await this.showAlert('Terlalu Banyak Percobaan', 'Silakan minta kode OTP baru.');
          return;
        }

        let msg = err.error?.message || 'Kode OTP salah.';
        if (remaining <= 2) msg += ` Sisa ${remaining} percobaan.`;
        await this.showAlert('Kode OTP Salah', msg);
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}
