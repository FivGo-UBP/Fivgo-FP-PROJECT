import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { ToastController, ActionSheetController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
  standalone: false,
})
export class PaymentPage implements OnInit, OnDestroy {
  balance: number = 0;
  transactions: any[] = [];
  isLoading: boolean = false;

  // State Top Up
  isTopUpModalOpen: boolean = false;
  topUpAmount: number = 20000;
  topUpMethod: string = 'qris';
  customAmount: string = '';

  // State Instruksi Pembayaran
  isPaymentInfoOpen: boolean = false;
  paymentInfo: any = null;
  isCheckingPayment: boolean = false;

  private pollingInterval: any = null;
  readonly virtualAccountMinAmount = 15000;

  constructor(
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadBalance(true);
  }

  ionViewWillLeave() {
    this.stopPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadBalance(showLoading: boolean = false) {
    if (showLoading) this.isLoading = true;
    this.orderService.getWalletBalance().subscribe({
      next: (res) => {
        this.balance = res.balance;
        this.transactions = res.transactions;
        this.isLoading = false;

        // Cek jika ada transaksi topup pending yang sudah sukses dari database
        const pendingTopup = this.transactions.find(t => t.type === 'topup' && t.status === 'pending');
        if (pendingTopup && !this.pollingInterval && this.isPaymentInfoOpen) {
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('Error fetching balance:', err);
        this.isLoading = false;
      }
    });
  }

  openTopUpModal() {
    this.isTopUpModalOpen = true;
    this.topUpAmount = 20000;
    this.customAmount = '';
    this.topUpMethod = 'qris';
  }

  closeTopUpModal() {
    this.isTopUpModalOpen = false;
  }

  selectAmount(amount: number) {
    this.topUpAmount = amount;
    this.customAmount = '';
  }

  onCustomAmountInput(event: any) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    this.customAmount = val;
    this.topUpAmount = val ? parseInt(val, 10) : 0;
  }

  async selectPaymentMethod() {
    const minAmountMet = this.topUpAmount >= this.virtualAccountMinAmount;

    const buttons = [
      {
        text: 'QRIS (E-Wallet & Mobile Banking)',
        handler: () => {
          this.topUpMethod = 'qris';
        }
      },
      {
        text: minAmountMet ? 'VA BCA' : 'VA BCA (Min Rp15.000)',
        cssClass: minAmountMet ? undefined : 'payment-option-disabled',
        disabled: !minAmountMet,
        handler: () => {
          if (minAmountMet) this.topUpMethod = 'bca';
        }
      },
      {
        text: minAmountMet ? 'VA Mandiri' : 'VA Mandiri (Min Rp15.000)',
        cssClass: minAmountMet ? undefined : 'payment-option-disabled',
        disabled: !minAmountMet,
        handler: () => {
          if (minAmountMet) this.topUpMethod = 'mandiri';
        }
      },
      {
        text: minAmountMet ? 'VA BNI' : 'VA BNI (Min Rp15.000)',
        cssClass: minAmountMet ? undefined : 'payment-option-disabled',
        disabled: !minAmountMet,
        handler: () => {
          if (minAmountMet) this.topUpMethod = 'bni';
        }
      },
      {
        text: minAmountMet ? 'VA BRI' : 'VA BRI (Min Rp15.000)',
        cssClass: minAmountMet ? undefined : 'payment-option-disabled',
        disabled: !minAmountMet,
        handler: () => {
          if (minAmountMet) this.topUpMethod = 'bri';
        }
      },
      {
        text: 'Cancel',
        role: 'cancel'
      }
    ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Pilih Metode Top Up',
      buttons
    });
    await actionSheet.present();
  }

  initiateTopUp() {
    if (this.topUpAmount < 10000) {
      this.showToast('Minimal pengisian saldo adalah Rp10.000', 'warning');
      return;
    }

    this.isTopUpModalOpen = false;
    this.isLoading = true;

    this.orderService.initiateTopUp(this.topUpAmount, this.topUpMethod).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.transaction) {
          this.paymentInfo = res.transaction;
          this.isPaymentInfoOpen = true;
          this.showToast('Silakan selesaikan pembayaran top up Anda', 'success');
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('Error initiating topup:', err);
        this.isLoading = false;
        this.showToast(err.error?.message || 'Gagal memproses top up. Coba lagi.', 'danger');
      }
    });
  }

  closePaymentInfo() {
    this.isPaymentInfoOpen = false;
    this.paymentInfo = null;
    this.stopPolling();
    this.loadBalance();
  }

  checkPaymentStatus() {
    if (this.isCheckingPayment) return;
    this.isCheckingPayment = true;

    this.orderService.getWalletBalance().subscribe({
      next: (res) => {
        this.isCheckingPayment = false;
        this.balance = res.balance;
        this.transactions = res.transactions;

        // Cari status transaksi topup aktif ini
        const activeTx = this.transactions.find(t => t.reference === this.paymentInfo?.reference);
        if (activeTx) {
          if (activeTx.status === 'success') {
            this.showToast('Top Up Saldo FivGo Pay Berhasil!', 'success');
            this.closePaymentInfo();
          } else if (activeTx.status === 'failed') {
            this.showToast('Top Up Saldo Gagal.', 'danger');
            this.closePaymentInfo();
          } else {
            this.showToast('Pembayaran belum diterima. Mohon selesaikan pembayaran.', 'warning');
          }
        }
      },
      error: () => {
        this.isCheckingPayment = false;
        this.showToast('Gagal memverifikasi status pembayaran.', 'danger');
      }
    });
  }

  startPolling() {
    this.stopPolling();
    this.pollingInterval = setInterval(() => {
      this.orderService.getWalletBalance().subscribe({
        next: (res) => {
          this.balance = res.balance;
          this.transactions = res.transactions;
          
          if (this.paymentInfo) {
            const activeTx = this.transactions.find(t => t.reference === this.paymentInfo.reference);
            if (activeTx && activeTx.status !== 'pending') {
              this.stopPolling();
              if (activeTx.status === 'success') {
                this.showToast('Top Up Saldo FivGo Pay Berhasil!', 'success');
                this.closePaymentInfo();
              } else if (activeTx.status === 'failed') {
                this.showToast('Top Up Saldo Gagal atau Kedaluwarsa.', 'danger');
                this.closePaymentInfo();
              }
            }
          }
        }
      });
    }, 4000); // Polling setiap 4 detik
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getDompetxDetail(): any {
    const payload = this.paymentInfo?.gateway_payload || {};
    const candidates = [
      payload?.detail?.data,
      payload?.detail?.payment,
      payload?.detail?.transaction,
      payload?.detail,
      payload?.data,
      payload?.payment,
      payload?.transaction,
      payload,
    ];

    return candidates.find(candidate => {
      return candidate && (typeof candidate !== 'object' || Object.keys(candidate).length > 0);
    }) || {};
  }

  getPaymentQrImage(): string {
    return this.getDompetxDetail()?.qrData?.qrImage || '';
  }

  getPaymentVaNumber(): string {
    const detail = this.getDompetxDetail();
    return detail?.vaData?.va_number
      || detail?.vaData?.vaNumber
      || detail?.vaData?.account_number
      || detail?.vaData?.accountNumber
      || detail?.virtualAccount?.accountNumber
      || detail?.virtualAccount?.number
      || detail?.virtualAccount?.va_number
      || detail?.virtualAccount?.account_number
      || detail?.va_number
      || detail?.vaNumber
      || detail?.account_number
      || detail?.accountNumber
      || '';
  }

  getPaymentVaBankName(): string {
    const detail = this.getDompetxDetail();
    return detail?.vaData?.bank_name
      || detail?.vaData?.bankName
      || detail?.virtualAccount?.bank_name
      || detail?.virtualAccount?.bankName
      || detail?.bank_name
      || detail?.bankName
      || (this.getPaymentVaNumber() ? this.paymentInfo?.payment_method?.toUpperCase() : '');
  }

  getPaymentReference(): string {
    const detail = this.getDompetxDetail();
    return detail?.qrData?.refId || detail?.refId || detail?.reference || this.paymentInfo?.transaction_id || '-';
  }

  formatPrice(price: number): string {
    return 'Rp ' + price?.toLocaleString('id-ID');
  }

  getTransactionIcon(type: string): string {
    const map: Record<string, string> = {
      topup: 'arrow-down-circle',
      payment: 'arrow-up-circle',
      payout: 'wallet',
    };
    return map[type] || 'swap-horizontal';
  }

  getTransactionColor(status: string): string {
    const map: Record<string, string> = {
      success: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return map[status] || 'medium';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
