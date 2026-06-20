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

export interface ChatNode {
  key?: string;
  label: string;
  children?: ChatNode[];
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

  // Modal state
  isBantuanModalOpen: boolean = false;
  activeFormType: string = ''; // 'keamanan' | 'barang_tertinggal' | 'driver_kendaraan' | 'batal_jalan'
  userEmail: string = '';

  // Form Models
  formKeamanan = { incidentType: '', description: '', isAgreed: false };
  formBarangTertinggal = { itemType: '', description: '', isAgreed: false };
  formDriverKendaraan = { issueType: '', description: '', isAgreed: false };
  formBatalJalan = { cancelReason: '', description: '', isAgreed: false };
  
  // Selected fields
  selectedCategoryKey: string = '';
  selectedCategoryLabel: string = '';
  selectedSubCategoryKey: string = '';
  selectedSubCategoryLabel: string = '';
  userDescription: string = '';

  private shouldScrollBottom = false;

  selectedPath: ChatNode[] = [];

  chatTree: ChatNode[] = [
    {
      key: 'keamanan',
      label: 'Lapor masalah keselamatan',
      children: [
        {
          label: 'Perilaku berkendara driver',
          children: [
            { label: 'Mengantuk saat menyetir', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Menggunakan HP saat berkendara', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Melanggar rambu lalu lintas', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Kecepatan terlalu tinggi / ngebut', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Fisik & Kecelakaan',
          children: [
            { label: 'Mengalami tabrakan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Terjatuh dari motor', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Kerusakan pada helm/sarana', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Kekerasan & Pelecehan',
          children: [
            { label: 'Pelecehan seksual', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Ancaman / Intimidasi verbal', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Tindakan kekerasan fisik', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        }
      ]
    },
    {
      key: 'barang_tertinggal',
      label: 'Lapor barang tertinggal',
      children: [
        {
          label: 'Barang Elektronik',
          children: [
            { label: 'Handphone / Smartphone', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Laptop / Tablet', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Kamera / Headphone', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Barang Berharga',
          children: [
            { label: 'Dompet / Kartu identitas', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Uang tunai / Saldo', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Perhiasan / Jam tangan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Tas & Pakaian',
          children: [
            { label: 'Tas ransel / Handbag', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Jaket / Pakaian pribadi', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Belanjaan / Makanan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        }
      ]
    },
    {
      key: 'driver_kendaraan',
      label: 'Lapor perilaku Mitra Pengemudi',
      children: [
        {
          label: 'Sikap & Pelayanan',
          children: [
            { label: 'Driver bersikap kasar / tidak sopan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Driver merokok saat berkendara', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Driver menolak mengantar ke tujuan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Ketidaksesuaian Data',
          children: [
            { label: 'Kendaraan tidak cocok dengan aplikasi', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Plat nomor berbeda', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Wajah Driver berbeda dengan foto', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Tarif & Argo',
          children: [
            { label: 'Driver meminta uang tunai tambahan', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Driver enggan memberikan kembalian', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Argo dinaikkan sepihak oleh driver', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        }
      ]
    },
    {
      key: 'batal_jalan',
      label: 'Masalah pembayaran',
      children: [
        {
          label: 'Metode Pembayaran',
          children: [
            { label: 'Salah pilih metode pembayaran', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Gagal bayar non-tunai', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lupa / kurang membayar ke driver', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        },
        {
          label: 'Tarif & Promo',
          children: [
            { label: 'Tarif tidak sesuai aplikasi', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Promo tidak terpotong', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Metode pembayaran terpotong ganda', children: [{ label: 'Kirim Laporan' }, { label: 'Akhiri Chat' }] },
            { label: 'Lainnya', children: [{ label: 'Lapor via Formulir' }, { label: 'Akhiri Chat' }] }
          ]
        }
      ]
    }
  ];

  getCurrentChoices(): ChatNode[] {
    if (this.currentState !== 'welcome' && this.currentState !== 'choosing_subcategory') {
      return [];
    }
    if (this.selectedPath.length === 0) {
      return this.chatTree;
    }
    const lastNode = this.selectedPath[this.selectedPath.length - 1];
    return lastNode.children || [];
  }

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
      this.userEmail = user?.email || 'customer@fivgo.com';
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

  private saveChatState() {
    if (!this.orderId) return;
    const state = {
      messages: this.messages,
      selectedPath: this.selectedPath,
      currentState: this.currentState,
      timestamp: Date.now()
    };
    localStorage.setItem(`chatbot_state_${this.orderId}`, JSON.stringify(state));
  }

  private clearChatState() {
    if (!this.orderId) return;
    localStorage.removeItem(`chatbot_state_${this.orderId}`);
  }

  saveReportToHistory(report: { kategori: string, deskripsi: string, tanggal: string }) {
    try {
      const existingHistoryJson = localStorage.getItem('laporan_masalah_history') || '[]';
      const existingHistory = JSON.parse(existingHistoryJson);
      existingHistory.unshift(report);
      localStorage.setItem('laporan_masalah_history', JSON.stringify(existingHistory));
    } catch (e) {
      console.error('Error saving report to history:', e);
    }
  }

  private loadOrderAndStart() {
    this.currentState = 'loading';
    this.orderService.getHistoryDetail(this.orderId!).subscribe({
      next: (res) => {
        this.order = res.data;
        
        const savedStateJson = localStorage.getItem(`chatbot_state_${this.orderId}`);
        if (savedStateJson) {
          try {
            const savedState = JSON.parse(savedStateJson);
            const savedTime = savedState.timestamp || 0;
            const now = Date.now();
            const tenMinutes = 10 * 60 * 1000;

            if (now - savedTime > tenMinutes) {
              this.clearChatState();
            } else {
              this.messages = (savedState.messages || []).map((m: any) => ({
                ...m,
                time: new Date(m.time)
              }));
              this.selectedPath = savedState.selectedPath || [];
              this.currentState = savedState.currentState || 'welcome';
              this.shouldScrollBottom = true;
              return;
            }
          } catch (e) {
            console.error('Error parsing saved chatbot state:', e);
            this.clearChatState();
          }
        }

        this.selectedPath = [];
        this.messages = [];
        const namaUser = this.user?.name || 'Customer';

        // Tampilkan bubble pertama: Halo Kak [Nama] 👋
        this.pushBotMessage(`Halo Kak ${namaUser} 👋`);
        
        // Tampilkan spinner mengetik untuk balon pesan kedua
        this.currentState = 'submitting';
        
        // Tampilkan bubble kedua setelah delay singkat
        setTimeout(() => {
          this.pushBotMessage(`Terima kasih sudah menghubungi kami! Pilih opsi di bawah untuk membantu menyelesaikan kendala perjalanan Anda:`);
          this.currentState = 'welcome'; // Tampilkan pilihan Level 1
          this.saveChatState();
        }, 1000);
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
    this.saveChatState();
  }

  pushUserMessage(text: string) {
    this.messages.push({ sender: 'user', text, time: new Date() });
    this.shouldScrollBottom = true;
    this.saveChatState();
  }

  // Selection handlers
  selectNode(node: ChatNode) {
    if (node.label !== 'Lapor via Formulir') {
      this.pushUserMessage(node.label);
    }
    this.selectedPath.push(node);
    this.saveChatState();

    // If the node has children, we show next level with a loading typing indicator first
    if (node.children && node.children.length > 0) {
      this.currentState = 'submitting'; // Tampilkan spinner loading, sembunyikan opsi
      this.saveChatState();
      
      let promptText = '';
      if (this.selectedPath.length === 1) {
        // reached Level 2 (Jenis masalah)
        promptText = `Mohon pilih jenis masalah mengenai **${node.label}** di bawah ini:`;
      } else if (this.selectedPath.length === 2) {
        // reached Level 3 (Detail kejadian)
        promptText = `Pilih detail kejadian dari masalah **${node.label}**:`;
      } else if (this.selectedPath.length === 3) {
        // reached Level 4 (Konfirmasi laporan)
        promptText = `Mohon konfirmasi pengiriman laporan Anda:`;
      }

      setTimeout(() => {
        this.pushBotMessage(promptText);
        this.currentState = 'choosing_subcategory'; // Tampilkan pilihan baru, hilangkan spinner
        this.saveChatState();
      }, 1000);
    } else {
      // reached Level 4 (Konfirmasi Laporan)
      if (node.label === 'Kirim Laporan') {
        this.submitReport();
      } else if (node.label === 'Lapor via Formulir') {
        const categoryKey = this.selectedPath[0]?.key || '';
        this.selectedPath.pop(); // Pop "Lapor via Formulir" so the path remains at Level 3 and options stay visible
        this.saveChatState();
        this.openBantuanForm(categoryKey);
      } else {
        // Akhiri Chat
        this.currentState = 'submitting'; // Tampilkan spinner loading
        this.selectedPath = [];
        this.clearChatState();
        setTimeout(() => {
          this.pushBotMessage('Chat diakhiri. Silakan pilih kendala Anda kembali jika masih membutuhkan bantuan:');
          this.currentState = 'welcome'; // Kembali ke opsi Level 1
          this.saveChatState();
        }, 1000);
      }
    }
  }

  submitReport() {
    this.currentState = 'submitting'; // Sembunyikan opsi, tampilkan spinner loading
    this.saveChatState();
    
    const mainCategoryKey = this.selectedPath[0]?.key || '';
    const mainCategory = this.selectedPath[0]?.label || '';
    const jenisMasalah = this.selectedPath[1]?.label || '';
    const detailKejadian = this.selectedPath[2]?.label || '';

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
Kategori Masalah: ${mainCategory}
Jenis Masalah (Level 2): ${jenisMasalah}
Detail Kejadian (Level 3): ${detailKejadian}
Detail Tambahan dari User: Dilaporkan langsung melalui alur percakapan terpandu chatbot.

--- Detail Perjalanan ---
${orderDetailsStr}
    `.trim();

    const kategoriLaporan = mainCategory;

    setTimeout(() => {
      this.formService.submitLaporanMasalah({
        nama: this.user?.name || 'Customer Bantuan Chatbot',
        telepon: this.user?.phone || '0000000000',
        kategori: kategoriLaporan,
        deskripsi: fullDescription,
        type: 'biasa',
        reporter_role: 'customer'
      }).subscribe({
        next: () => {
          // Ketika laporan terkirim, hilangkan path
          this.selectedPath = [];
          this.clearChatState();

          this.saveReportToHistory({
            kategori: kategoriLaporan,
            deskripsi: fullDescription,
            tanggal: new Date().toISOString()
          });
          
          let responseMsg = '';
          if (mainCategoryKey === 'keamanan') {
            responseMsg = `Laporan masalah keselamatan Anda (${detailKejadian}) telah berhasil terkirim. Tim keamanan kami akan segera menginvestigasi kronologi kejadian ini.`;
          } else if (mainCategoryKey === 'barang_tertinggal') {
            responseMsg = `Laporan barang tertinggal (${detailKejadian}) berhasil dibuat. Kami akan segera berkoordinasi dengan Driver untuk melacak barang Anda.`;
          } else if (mainCategoryKey === 'driver_kendaraan') {
            responseMsg = `Laporan perilaku Driver (${detailKejadian}) berhasil terkirim. Kami sangat menghargai laporan Anda untuk meningkatkan kualitas layanan.`;
          } else {
            responseMsg = `Laporan masalah pembayaran Anda (${detailKejadian}) berhasil dibuat. Tim kami akan segera meninjau transaksi ini.`;
          }
          
          // Kirim balasan bot pertama (spinner loading masih menyala)
          this.pushBotMessage(responseMsg);
          
          // Tampilkan spinner mengetik lagi untuk respon penutup
          setTimeout(() => {
            this.pushBotMessage('Apakah ada hal lain yang bisa kami bantu? Silakan pilih opsi di bawah:');
            this.currentState = 'welcome'; // Kembali ke Level 1
            this.saveChatState();
          }, 1200);
        },
        error: (err) => {
          console.error('Gagal kirim laporan chatbot:', err);
          this.selectedPath.pop(); // hilangkan node 'Kirim Laporan'
          this.currentState = 'choosing_subcategory'; // kembalikan ke Level 3/4
          this.saveChatState();
          const errorMsg = err?.error?.message || 'Gagal mengirim laporan. Periksa koneksi Anda.';
          this.pushBotMessage(`Gagal mengirim laporan: "${errorMsg}". Silakan ketuk kembali pilihan Anda.`);
        }
      });
    }, 800);
  }

  openBantuanForm(formType: string) {
    this.activeFormType = formType;
    this.isBantuanModalOpen = true;
    
    // reset form fields
    this.formKeamanan = { incidentType: '', description: '', isAgreed: false };
    this.formBarangTertinggal = { itemType: '', description: '', isAgreed: false };
    this.formDriverKendaraan = { issueType: '', description: '', isAgreed: false };
    this.formBatalJalan = { cancelReason: '', description: '', isAgreed: false };
  }

  closeBantuanForm() {
    this.isBantuanModalOpen = false;
  }

  isFormValid(): boolean {
    if (this.activeFormType === 'keamanan') {
      return !!this.formKeamanan.incidentType && this.formKeamanan.description.trim().length >= 35;
    }
    if (this.activeFormType === 'barang_tertinggal') {
      return !!this.formBarangTertinggal.itemType && this.formBarangTertinggal.description.trim().length >= 35;
    }
    if (this.activeFormType === 'driver_kendaraan') {
      return !!this.formDriverKendaraan.issueType && this.formDriverKendaraan.description.trim().length >= 35;
    }
    if (this.activeFormType === 'batal_jalan') {
      return !!this.formBatalJalan.cancelReason && this.formBatalJalan.description.trim().length >= 35;
    }
    return false;
  }

  submitBantuanForm() {
    if (!this.isFormValid()) return;

    this.isBantuanModalOpen = false;
    this.currentState = 'submitting';
    this.saveChatState();

    let selectedDetails = '';
    let categoryTitle = '';
    let descriptionText = '';

    if (this.activeFormType === 'keamanan') {
      categoryTitle = 'Lapor masalah keselamatan';
      selectedDetails = `Jenis Insiden: ${this.formKeamanan.incidentType}`;
      descriptionText = this.formKeamanan.description;
    } else if (this.activeFormType === 'barang_tertinggal') {
      categoryTitle = 'Lapor barang tertinggal';
      selectedDetails = `Jenis Barang: ${this.formBarangTertinggal.itemType}`;
      descriptionText = this.formBarangTertinggal.description;
    } else if (this.activeFormType === 'driver_kendaraan') {
      categoryTitle = 'Lapor perilaku Mitra Pengemudi';
      selectedDetails = `Jenis Perilaku: ${this.formDriverKendaraan.issueType}`;
      descriptionText = this.formDriverKendaraan.description;
    } else if (this.activeFormType === 'batal_jalan') {
      categoryTitle = 'Masalah pembayaran';
      selectedDetails = `Alasan Batal: ${this.formBatalJalan.cancelReason}`;
      descriptionText = this.formBatalJalan.description;
    }

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
Kategori Masalah: ${categoryTitle}
Rincian (Level 2/3): ${selectedDetails}
Detail Tambahan (Formulir): ${descriptionText}

--- Detail Perjalanan ---
${orderDetailsStr}
    `.trim();

    const kategoriLaporan = categoryTitle;

    setTimeout(() => {
      this.formService.submitLaporanMasalah({
        nama: this.user?.name || 'Customer Bantuan Chatbot',
        telepon: this.user?.phone || '0000000000',
        kategori: kategoriLaporan,
        deskripsi: fullDescription,
        type: 'formulir',
        reporter_role: 'customer'
      }).subscribe({
        next: () => {
          this.selectedPath = [];
          this.clearChatState();

          this.saveReportToHistory({
            kategori: kategoriLaporan,
            deskripsi: fullDescription,
            tanggal: new Date().toISOString()
          });

          this.pushBotMessage(`Laporan formulir Anda mengenai **${categoryTitle}** telah berhasil dikirim.`);
          
          setTimeout(() => {
            this.pushBotMessage('Apakah ada hal lain yang bisa kami bantu? Silakan pilih opsi di bawah:');
            this.currentState = 'welcome';
            this.saveChatState();
          }, 1200);
        },
        error: (err) => {
          console.error('Gagal kirim formulir chatbot:', err);
          this.currentState = 'choosing_subcategory';
          this.saveChatState();
          const errorMsg = err?.error?.message || 'Gagal mengirim laporan. Periksa koneksi Anda.';
          this.pushBotMessage(`Gagal mengirim laporan formulir: "${errorMsg}". Silakan coba lagi.`);
        }
      });
    }, 800);
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
