import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription, interval } from 'rxjs';

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reference: string;
  payment_method: string | null;
  description: string | null;
  gateway_payload: any | null;
  created_at: string;
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
  standalone: false,
})
export class WalletPage implements OnInit, OnDestroy {
  balance: number = 0;
  transactions: WalletTransaction[] = [];
  isLoading: boolean = false;

  // Top Up Modal State
  isTopUpModalOpen: boolean = false;
  topUpAmount: number = 20000;
  selectedPaymentMethod: string = 'qris';

  // Withdrawal Modal State
  isWithdrawModalOpen: boolean = false;
  withdrawAmount: number = 50000;
  bankName: string = 'BCA';
  accountNumber: string = '';
  accountName: string = '';

  // Payment Gateway (DompetX) Modal State
  isPaymentGatewayOpen: boolean = false;
  isCreatingPayment: boolean = false;
  paymentInfo: any = null;
  paymentError: string = '';
  pollingSub: Subscription | null = null;

  paymentOptions = [
    { label: 'QRIS', code: 'qris' },
    { label: 'VA BCA', code: 'bca' },
    { label: 'VA BNI', code: 'bni' },
    { label: 'VA BRI', code: 'bri' },
    { label: 'VA Mandiri', code: 'mandiri' },
  ];

  constructor(
    private orderService: OrderService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.orderService.getWalletBalance().subscribe({
      next: (res) => {
        this.balance = res.balance;
        this.transactions = res.transactions;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching balance:', err);
        this.isLoading = false;
        this.showToast('Gagal memuat saldo dompet', 'danger');
      },
    });
  }

  // ─── Top Up Logic ────────────────────────────────────────────────────────

  openTopUpModal() {
    this.isTopUpModalOpen = true;
    this.topUpAmount = 20000;
    this.selectedPaymentMethod = 'qris';
  }

  closeTopUpModal() {
    this.isTopUpModalOpen = false;
  }

  async submitTopUp() {
    if (this.topUpAmount < 10000) {
      this.showToast('Jumlah top up minimal Rp10.000', 'warning');
      return;
    }

    this.isTopUpModalOpen = false;
    this.isPaymentGatewayOpen = true;
    this.isCreatingPayment = true;
    this.paymentInfo = null;
    this.paymentError = '';

    this.orderService.initiateTopUp(this.topUpAmount, this.selectedPaymentMethod).subscribe({
      next: (res) => {
        this.paymentInfo = res.transaction;
        this.isCreatingPayment = false;
        this.startPolling();
      },
      error: (err) => {
        console.error('Error initiating topup:', err);
        this.isCreatingPayment = false;
        this.paymentError = err?.error?.message || 'Gagal menyiapkan pembayaran digital';
        this.showToast(this.paymentError, 'danger');
      }
    });
  }

  // ─── Withdrawal Logic ─────────────────────────────────────────────────────

  openWithdrawModal() {
    if (this.balance < 20000) {
      this.showToast('Saldo Anda kurang dari batas minimal penarikan (Rp20.000)', 'warning');
      return;
    }
    this.isWithdrawModalOpen = true;
    this.withdrawAmount = Math.max(20000, this.balance);
    this.bankName = 'BCA';
    this.accountNumber = '';
    this.accountName = '';
  }

  closeWithdrawModal() {
    this.isWithdrawModalOpen = false;
  }

  async submitWithdraw() {
    if (this.withdrawAmount < 20000) {
      this.showToast('Batas minimal penarikan adalah Rp20.000', 'warning');
      return;
    }

    if (this.withdrawAmount > this.balance) {
      this.showToast('Nominal penarikan melebihi saldo aktif Anda', 'warning');
      return;
    }

    if (!this.accountNumber.trim() || !this.accountName.trim()) {
      this.showToast('Harap isi nomor rekening dan nama pemilik rekening', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Mengirim pengajuan penarikan...'
    });
    await loading.present();

    this.orderService.withdraw(
      this.withdrawAmount,
      this.bankName,
      this.accountNumber,
      this.accountName
    ).subscribe({
      next: () => {
        loading.dismiss();
        this.isWithdrawModalOpen = false;
        this.loadData();
        this.showSuccessAlert(
          'Pengajuan Dikirim',
          `Permintaan penarikan saldo sebesar Rp${this.withdrawAmount.toLocaleString('id-ID')} berhasil diajukan. Proses peninjauan memakan waktu maksimal 1x24 jam.`
        );
      },
      error: (err) => {
        loading.dismiss();
        console.error('Error processing withdrawal:', err);
        const errMsg = err?.error?.message || 'Gagal mengirimkan pengajuan penarikan';
        this.showToast(errMsg, 'danger');
      }
    });
  }

  // ─── Payment Polling Helpers ──────────────────────────────────────────────

  startPolling() {
    this.stopPolling();
    this.pollingSub = interval(4000).subscribe(() => {
      if (this.paymentInfo?.id) {
        this.orderService.getWalletBalance().subscribe({
          next: (res) => {
            const tx = res.transactions.find(t => t.id === this.paymentInfo.id);
            if (tx) {
              this.paymentInfo = tx;
              if (tx.status === 'success') {
                this.stopPolling();
                this.isPaymentGatewayOpen = false;
                this.loadData();
                this.showSuccessAlert(
                  'Top Up Berhasil',
                  `Pengisian saldo sebesar Rp${tx.amount.toLocaleString('id-ID')} telah sukses dikreditkan ke dompet Anda.`
                );
              } else if (tx.status === 'failed') {
                this.stopPolling();
                this.paymentError = 'Pembayaran dibatalkan atau kadaluarsa';
              }
            }
          }
        });
      }
    });
  }

  stopPolling() {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  closePaymentGateway() {
    this.stopPolling();
    this.isPaymentGatewayOpen = false;
    this.loadData();
  }

  // ─── UI Helpers ───────────────────────────────────────────────────────────

  getPaymentQrImage(): string | null {
    const payload = this.paymentInfo?.gateway_payload || {};
    return payload?.detail?.data?.qr_image 
      || payload?.detail?.payment?.qr_image 
      || payload?.qr_image 
      || payload?.qrImage 
      || null;
  }

  getPaymentVaNumber(): string | null {
    const payload = this.paymentInfo?.gateway_payload || {};
    const detail = payload?.detail?.data || payload?.detail?.payment || payload;
    return detail?.va_number || detail?.vaNumber || detail?.payment_code || detail?.paymentCode || null;
  }

  getPaymentVaBankName(): string {
    const method = (this.paymentInfo?.payment_method || '').toLowerCase();
    if (method.startsWith('va_')) return method.substring(3).toUpperCase();
    if (method === 'bca' || method === 'bni' || method === 'bri' || method === 'mandiri') return method.toUpperCase();
    return 'Bank';
  }

  getPaymentReference(): string {
    return this.paymentInfo?.reference || '';
  }

  getPaymentStatusLabel(): string {
    const status = (this.paymentInfo?.status || '').toLowerCase();
    if (status === 'success') return 'Sukses';
    if (status === 'failed') return 'Gagal';
    return 'Menunggu Pembayaran';
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

  async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  getTransactionIcon(type: string): string {
    if (type === 'topup' || type === 'refund' || type === 'income') return 'arrow-down-circle';
    return 'arrow-up-circle';
  }

  getTransactionColor(tx: WalletTransaction): string {
    if (tx.status === 'failed') return 'danger';
    if (tx.status === 'pending') return 'warning';
    return tx.amount > 0 ? 'success' : 'dark';
  }

  getTransactionLabel(tx: WalletTransaction): string {
    if (tx.description) return tx.description;
    
    const typeLabels: Record<string, string> = {
      topup: 'Pengisian Saldo',
      payout: 'Penarikan Dana',
      commission: 'Potongan Komisi',
      income: 'Pendapatan Perjalanan',
      refund: 'Pengembalian Dana',
      penalty: 'Denda Pembatalan'
    };
    return typeLabels[tx.type] || tx.type;
  }
}
