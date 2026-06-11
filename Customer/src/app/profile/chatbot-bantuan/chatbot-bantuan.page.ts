import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AuthService, User } from '../../services/auth.service';
import { OrderService, OrderDetail } from '../../services/order.service';
import { FormService } from '../../services/form.service';
import { LanguageService } from '../../services/language.service';

export interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: Date;
}

export type ChatState = 'loading' | 'welcome' | 'choosing_subcategory' | 'waiting_description' | 'submitting' | 'done' | 'error';

@Component({
  selector: 'app-chatbot-bantuan',
  templateUrl: './chatbot-bantuan.page.html',
  styleUrls: ['./chatbot-bantuan.page.scss'],
  standalone: false,
})
export class ChatbotBantuanPage implements OnInit, AfterViewChecked {
  @ViewChild('messageList') private messageList!: ElementRef;

  orderId: string | null = null;
  order: OrderDetail | null = null;
  user: User | null = null;
  messages: ChatMessage[] = [];
  currentState: ChatState = 'loading';
  
  // Input bindings
  userTextInput: string = '';
  
  // Selected fields
  selectedCategoryKey: string = '';
  selectedCategoryLabel: string = '';
  selectedSubCategoryKey: string = '';
  selectedSubCategoryLabel: string = '';
  userDescription: string = '';

  private shouldScrollBottom = false;

  // Main Categories
  categories = [
    { key: 'barang_tertinggal', label: '🎒 Barang Tertinggal' },
    { key: 'tarif_pembayaran', label: '💵 Masalah Tarif/Pembayaran' },
    { key: 'driver_kendaraan', label: '🚗 Driver & Kendaraan' },
    { key: 'keamanan', label: '⚠️ Masalah Keamanan' }
  ];

  // Sub Categories for Payment Issues
  paymentSubCategories = [
    { key: 'tarif_tidak_sesuai', label: 'Tarif tidak sesuai aplikasi' },
    { key: 'terpotong_ganda', label: 'Saldo terpotong ganda' },
    { key: 'promo_gagal', label: 'Promo/Diskon tidak diterapkan' }
  ];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private authService: AuthService,
    private orderService: OrderService,
    private formService: FormService,
    public langService: LanguageService
  ) { }

  ngOnInit() {
    // Get current user
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });

    // Get order ID from query params
    this.route.queryParams.subscribe(params => {
      this.orderId = params['order_id'] ?? null;
      if (this.orderId) {
        this.loadOrderAndStart();
      } else {
        this.currentState = 'error';
        this.pushBotMessage('Oops! Tidak ada ID perjalanan yang ditemukan. Silakan kembali ke halaman bantuan.');
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messageList?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private loadOrderAndStart() {
    this.currentState = 'loading';
    this.orderService.getHistoryDetail(this.orderId!).subscribe({
      next: (res) => {
        this.order = res.data;
        this.currentState = 'welcome';
        
        const namaUser = this.user?.name || 'Customer';
        const tujuan = this.order?.dropoff_address || 'tujuan Anda';
        const tarif = this.formatPrice(this.order?.final_price || this.order?.estimated_price || 0);
        const waktu = this.formatDateTime(this.order?.created_at || '');

        this.pushBotMessage(`Halo **${namaUser}**! Ada yang bisa kami bantu mengenai perjalanan Anda ke **${tujuan}** pada **${waktu}** (Tarif: **${tarif}**)?`);
      },
      error: (err) => {
        console.error('Gagal mengambil detail order:', err);
        this.currentState = 'error';
        this.pushBotMessage('Maaf, kami gagal memuat detail perjalanan Anda. Silakan periksa koneksi internet Anda dan coba lagi.');
      }
    });
  }

  // Helper methods to add messages
  pushBotMessage(text: string) {
    this.messages.push({ sender: 'bot', text, time: new Date() });
    this.shouldScrollBottom = true;
  }

  pushUserMessage(text: string) {
    this.messages.push({ sender: 'user', text, time: new Date() });
    this.shouldScrollBottom = true;
  }

  // Selection handlers
  selectCategory(categoryKey: string, label: string) {
    this.pushUserMessage(label);
    this.selectedCategoryKey = categoryKey;
    this.selectedCategoryLabel = label;

    if (categoryKey === 'tarif_pembayaran') {
      this.currentState = 'choosing_subcategory';
      setTimeout(() => {
        this.pushBotMessage('Mohon pilih detail masalah pembayaran Anda di bawah ini:');
      }, 500);
    } else if (categoryKey === 'barang_tertinggal') {
      this.currentState = 'waiting_description';
      setTimeout(() => {
        this.pushBotMessage('Mohon sebutkan barang apa yang tertinggal (misal: Dompet cokelat, HP, dll.). Kami akan meneruskan laporan ini untuk menghubungi Driver.');
      }, 500);
    } else if (categoryKey === 'driver_kendaraan') {
      this.currentState = 'waiting_description';
      setTimeout(() => {
        this.pushBotMessage('Bisa Anda ceritakan detail masalah terkait driver atau kendaraannya?');
      }, 500);
    } else if (categoryKey === 'keamanan') {
      this.currentState = 'waiting_description';
      setTimeout(() => {
        this.pushBotMessage('Keamanan Anda adalah prioritas kami. Mohon deskripsikan masalah keamanan atau tindakan ugal-ugalan yang Anda alami agar kami bisa segera menindaklanjutinya.');
      }, 500);
    }
  }

  selectSubCategory(subKey: string, label: string) {
    this.pushUserMessage(label);
    this.selectedSubCategoryKey = subKey;
    this.selectedSubCategoryLabel = label;

    this.currentState = 'waiting_description';
    setTimeout(() => {
      this.pushBotMessage('Apakah Anda ingin menambahkan detail deskripsi atau kronologi tambahan? Silakan ketik di bawah ini, atau jika dirasa cukup, Anda bisa langsung menekan tombol **"Kirim Laporan"**.');
    }, 500);
  }

  // Submit methods
  submitDescription() {
    const text = this.userTextInput.trim();
    if (text) {
      this.pushUserMessage(text);
      this.userDescription = text;
      this.userTextInput = '';
    }
    this.processLaporanSubmission();
  }

  processLaporanSubmission() {
    this.currentState = 'submitting';
    this.pushBotMessage('Sedang mengirimkan laporan Anda ke tim Customer Service kami...');

    // Buat deskripsi lengkap laporan untuk disubmit ke API
    const orderDetailsStr = `
- Order ID: ${this.order?.id}
- Tujuan: ${this.order?.dropoff_address}
- Penjemputan: ${this.order?.pickup_address}
- Waktu: ${this.formatDateTime(this.order?.created_at || '')}
- Tarif: ${this.formatPrice(this.order?.final_price || this.order?.estimated_price || 0)}
- Metode Pembayaran: ${this.order?.payment_method || 'Unknown'}
- Jenis Kendaraan: ${this.order?.vehicle_type || 'Unknown'}
    `.trim();

    const fullDescription = `
Kategori Masalah: ${this.selectedCategoryLabel} ${this.selectedSubCategoryLabel ? ' - ' + this.selectedSubCategoryLabel : ''}
Detail Tambahan dari User: ${this.userDescription || 'Tidak ada deskripsi tambahan.'}

--- Detail Perjalanan ---
${orderDetailsStr}
    `.trim();

    const kategoriLaporan = `Bantuan Order #${this.order?.id?.substring(0, 8)} - ${this.selectedCategoryLabel}`;

    this.formService.submitLaporanMasalah({
      nama: this.user?.name || 'Customer Bantuan Chatbot',
      telepon: this.user?.phone || '0000000000',
      kategori: kategoriLaporan,
      deskripsi: fullDescription
    }).subscribe({
      next: () => {
        this.currentState = 'done';
        this.pushBotMessage('Laporan Anda berhasil dikirim! Tim kami akan memproses dan menghubungi Anda kembali melalui email atau nomor telepon terdaftar dalam waktu 1-3 hari kerja. Terima kasih.');
      },
      error: (err) => {
        console.error('Gagal kirim laporan chatbot:', err);
        this.currentState = 'waiting_description';
        const errorMsg = err?.error?.message || 'Gagal mengirim laporan. Periksa koneksi Anda.';
        this.pushBotMessage(`Gagal mengirim laporan: "${errorMsg}". Silakan coba kirim ulang laporan Anda.`);
      }
    });
  }

  formatMessageText(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // Basic utility methods
  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }

  formatPrice(price: number): string {
    const locale = this.langService.getLanguage() === 'id' ? 'id-ID' : 'en-US';
    return 'Rp' + price?.toLocaleString(locale);
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  }
}
