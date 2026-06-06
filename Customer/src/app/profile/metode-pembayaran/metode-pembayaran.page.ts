import { Component, OnInit } from '@angular/core';
import { ActionSheetController, ToastController, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

interface NonTunaiOption {
  label: string;
  code: string;
  minAmount?: number;
}

@Component({
  selector: 'app-metode-pembayaran',
  templateUrl: './metode-pembayaran.page.html',
  styleUrls: ['./metode-pembayaran.page.scss'],
  standalone: false,
})
export class MetodePembayaranPage implements OnInit {

  selectedPayment: string = 'tunai';
  selectedNonTunai: string = 'qris';
  readonly virtualAccountMinAmount = 15000;
  currentAmount = 0;
  backHref: string = '/kelola-profile';
  walletBalance = 0;
  isLoadingWallet = false;

  readonly nonTunaiOptions: NonTunaiOption[] = [
    { label: 'QRIS', code: 'qris' },
    { label: 'VA BCA', code: 'bca', minAmount: this.virtualAccountMinAmount },
    { label: 'VA BNI', code: 'bni', minAmount: this.virtualAccountMinAmount },
    { label: 'VA BRI', code: 'bri', minAmount: this.virtualAccountMinAmount },
    { label: 'VA Mandiri', code: 'mandiri', minAmount: this.virtualAccountMinAmount },
    { label: 'VA Permata', code: 'permata', minAmount: this.virtualAccountMinAmount },
    { label: 'VA CIMB', code: 'cimb', minAmount: this.virtualAccountMinAmount },
    { label: 'VA Danamon', code: 'danamon', minAmount: this.virtualAccountMinAmount },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    private orderService: OrderService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.currentAmount = Number(this.route.snapshot.queryParamMap.get('amount') || 0);
    this.backHref = this.currentAmount > 0 ? '/map-visual' : '/kelola-profile';

    // Baca pilihan yang tersimpan sebelumnya
    const saved = localStorage.getItem('selectedPayment');
    const savedNonTunai = localStorage.getItem('selectedNonTunai');
    if (saved) this.selectedPayment = saved;
    if (savedNonTunai) this.selectedNonTunai = this.normalizePaymentCode(savedNonTunai);
    if (!this.canUseNonTunaiOption(this.selectedNonTunai)) {
      this.selectedNonTunai = 'qris';
    }
    if (this.selectedPayment === 'nontunai') {
      this.persistNonTunai();
    }
  }

  ionViewWillEnter() {
    this.loadWalletBalance();
  }

  loadWalletBalance() {
    this.isLoadingWallet = true;
    this.orderService.getWalletBalance().subscribe({
      next: (res) => {
        this.walletBalance = res.balance;
        this.isLoadingWallet = false;
      },
      error: (err) => {
        console.error('Error fetching wallet balance:', err);
        this.isLoadingWallet = false;
      }
    });
  }

  goToTopUp() {
    this.router.navigate(['/beranda/pembayaran']);
  }

  selectPayment(method: string, autoSubmit: boolean = false) {
    this.selectedPayment = method;
    localStorage.setItem('selectedPayment', method);
    if (method === 'nontunai') {
      this.persistNonTunai();
    }

    if (autoSubmit) {
      if (method === 'tunai') {
        this.confirmSelection();
      } else if (method === 'wallet') {
        if (this.currentAmount <= 0 || this.walletBalance >= this.currentAmount) {
          this.confirmSelection();
        }
      } else if (method === 'nontunai') {
        this.confirmSelection();
      }
    }
  }

  toggleNonTunai() {
    if (this.selectedPayment === 'nontunai') {
      this.openNonTunaiSheet();
    } else {
      this.selectPayment('nontunai', true);
    }
  }

  setUtama(method: string) {
    this.selectPayment(method);
  }

  async openNonTunaiSheet(event?: Event) {
    event?.stopPropagation();
    this.selectPayment('nontunai');

    const buttons = [
      ...this.nonTunaiOptions.map(option => {
        const available = this.canUseNonTunaiOption(option);

        return {
          text: this.getNonTunaiOptionLabel(option),
          cssClass: available ? undefined : 'payment-option-disabled',
          disabled: !available,
          handler: () => {
            if (!available) {
              this.showMinimumToast();
              return false;
            }

            this.selectNonTunai(option.code);
            return true;
          }
        };
      }),
      {
        text: 'Cancel',
        role: 'cancel',
      }
    ];

    const sheet = await this.actionSheetCtrl.create({
      cssClass: 'payment-method-sheet',
      buttons
    });

    await sheet.present();
  }

  selectNonTunai(method: string) {
    const code = this.normalizePaymentCode(method);
    if (!this.canUseNonTunaiOption(code)) {
      this.selectedNonTunai = 'qris';
      this.persistNonTunai();
      this.showMinimumToast();
      return;
    }

    this.selectedNonTunai = code;
    this.selectedPayment = 'nontunai';
    localStorage.setItem('selectedPayment', 'nontunai');
    localStorage.setItem('selectedNonTunai', this.selectedNonTunai);
    this.confirmSelection();
  }

  getSelectedNonTunaiLabel(): string {
    return this.nonTunaiOptions.find(option => option.code === this.selectedNonTunai)?.label || 'QRIS';
  }

  normalizePaymentCode(value: string): string {
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (['QRIS', 'QRIS_VA', 'QRIS/VA', 'NON_TUNAI', 'NONTUNAI', 'DOMPETX'].includes(normalized)) {
      return 'qris';
    }

    const aliases: Record<string, string> = {
      VA: 'bca',
      VIRTUAL_ACCOUNT: 'bca',
      VA_BCA: 'bca',
      BCA: 'bca',
      VA_BNI: 'bni',
      BNI: 'bni',
      VA_BRI: 'bri',
      BRI: 'bri',
      VA_MANDIRI: 'mandiri',
      MANDIRI: 'mandiri',
      VA_PERMATA: 'permata',
      PERMATA: 'permata',
      VA_CIMB: 'cimb',
      CIMB: 'cimb',
      VA_DANAMON: 'danamon',
      DANAMON: 'danamon',
    };

    return aliases[normalized] || 'qris';
  }

  canUseNonTunaiOption(optionOrCode: NonTunaiOption | string): boolean {
    const option = typeof optionOrCode === 'string'
      ? this.nonTunaiOptions.find(item => item.code === this.normalizePaymentCode(optionOrCode))
      : optionOrCode;

    if (!option?.minAmount || !this.currentAmount) {
      return true;
    }

    return this.currentAmount >= option.minAmount;
  }

  getNonTunaiOptionLabel(option: NonTunaiOption): string {
    if (!this.canUseNonTunaiOption(option) && option.minAmount) {
      return `${option.label} (min Rp ${option.minAmount.toLocaleString('id-ID')})`;
    }

    return option.label;
  }

  shouldShowVaMinimumWarning(): boolean {
    return this.selectedPayment === 'nontunai'
      && (!this.currentAmount || this.currentAmount < this.virtualAccountMinAmount);
  }

  getVaMinimumWarning(): string {
    if (this.currentAmount && this.currentAmount < this.virtualAccountMinAmount) {
      return `VA minimal Rp ${this.virtualAccountMinAmount.toLocaleString('id-ID')}. Untuk tarif ini gunakan QRIS atau Tunai.`;
    }

    return `VA minimal Rp ${this.virtualAccountMinAmount.toLocaleString('id-ID')}.`;
  }

  private async showMinimumToast() {
    const toast = await this.toastCtrl.create({
      message: `VA minimal Rp ${this.virtualAccountMinAmount.toLocaleString('id-ID')}. Untuk tarif ini gunakan QRIS atau Tunai.`,
      duration: 2200,
      color: 'warning',
      position: 'top'
    });

    await toast.present();
  }

  confirmSelection() {
    if (this.selectedPayment === 'wallet' && this.currentAmount > 0 && this.walletBalance < this.currentAmount) {
      this.toastCtrl.create({
        message: `Saldo FivGo Pay tidak cukup untuk perjalanan ini. Silakan lakukan Top Up terlebih dahulu atau ganti metode pembayaran.`,
        duration: 3000,
        color: 'danger',
        position: 'top'
      }).then(toast => toast.present());
      return;
    }

    this.toastCtrl.create({
      message: 'Metode pembayaran berhasil disimpan!',
      duration: 1500,
      color: 'success',
      position: 'top'
    }).then(toast => {
      toast.present();
      setTimeout(() => {
        this.navCtrl.back();
      }, 300);
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  private persistNonTunai() {
    localStorage.setItem('selectedPayment', 'nontunai');
    localStorage.setItem('selectedNonTunai', this.selectedNonTunai);
  }
}
