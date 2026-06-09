import { Component, OnInit } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
  hasForm?: boolean;
  formType?: 'lupa-bayar' | 'tidak-sampai-tujuan' | 'info-tidak-sesuai';
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
  standalone: false,
})
export class FAQPage implements OnInit {
  faqItems: FaqItem[] = [
    {
      question: 'Saya lupa / kurang membayar ke Mitra Pengemudi',
      answer: `
        <p class="faq-paragraph">Lupa atau kurang membayar tunai ke Mitra Pengemudi? Jangan khawatir, beritahu kami dengan mengisi formulir dibawah ini, dan kami akan bantu menyelesaikan permintaan Anda</p>
        <h4 class="faq-subheading">Pembayaran tertunggak dan pemesanan baru</h4>
        <p class="faq-paragraph">Dalam beberapa kasus, Anda perlu menyelesaikan pembayaran tertunggak sebelum dapat membuat pesanan baru. Pembayaran non-tunai akan kembali aktif setelah tagihan tertunggak diselesaikan</p>
        <p class="faq-paragraph">Jika Anda mengalami kesulitan menyelesaikan pembayaran tertunggak melalui aplikasi,mohon beri tahu kami memalui formulir dibawah ini dan kami siap membantu permintaan Anda</p>
      `,
      hasForm: true,
      formType: 'lupa-bayar',
      isOpen: false
    },
    {
      question: 'Cara melaporkan Mitra Pengemudi',
      answer: `
        <p class="faq-paragraph">Mengalami perjalanan yang kurang menyenangkan? Berikut panduannya.</p>
        <h4 class="faq-subheading">Cara melaporkan Mitra Pengemudi</h4>
        <p class="faq-paragraph">Kami menyesal mendengar perjalanan Anda tidak sesuai harapan. Keselamatan dan kenyamanan Anda adalah prioritas kami. Untuk membantu kami meningkatkan layanan:</p>
        <ul class="faq-list">
          <li>Beri <em>rating</em> segera setelah perjalanan selesai.</li>
          <li>Akses melalui tab <strong>Aktivitas</strong> di aplikasi FivGo.</li>
        </ul>
        <p class="faq-paragraph">Setelah memberi <em>rating</em>, Anda dapat memberikan umpan balik spesifik terkait pengalaman yang diterima. Kami menangani setiap umpan balik dengan serius untuk meningkatkan standar layanan.</p>
      `,
      isOpen: false
    },
    {
      question: 'Mitra Pengemudi tidak mengantarkan sampai ke tujuan',
      answer: `
        <p class="faq-paragraph">Mitra Pengemudi wajib mengantar Anda sampai ke tujuan sesuai pesanan di aplikasi</p>
        <p class="faq-paragraph"> Jika Anda ingin turun sebelum sampai ke titik pengantaran, Anda akan tetap dibebankan tarif penuh sesuai aplikasi</p>
        <p class="faq-paragraph">Namun jika Anda terpaksa turun ditengah perjalanan, ataupun Mitra Pengemudi membahayakan keselamatan Anda, segera laporkan dengan mengirim email ke customer service di halaman pusat bantuan.</p>
      `,
      hasForm: true,
      formType: 'tidak-sampai-tujuan',
      isOpen: false
    },
    {
      question: 'Informasi Mitra Pengemudi tidak sesuai aplikasi',
      answer: `
        <p class="faq-paragraph">Di FivGo, kami mengutamakan keselamatan Anda. Kami mewajibkan semua Mitra Pengemudi untuk menjaga informasi pribadi dan kendaraan mereka tetap terbaru. Jika Anda melihat ketidaksesuaian antara informasi Mitra Pengemudi atau kendaraan Anda dengan yang ditampilkan di aplikasi, mohon kabari kami. </p>
        <p class="faq-paragraph">FivGo melarang Mitra Pengemudi untuk berbagi akun pengemudi mereka. Mereka hanya boleh mengoperasikan kendaraan yang terdaftar di FivGo.</p>
        <p class="faq-paragraph">Jika Anda mendapati informasi Mitra Pengemudi atau kendaraan penjemput Anda tidak sesuai dengan detail di aplikasi FivGo Anda, laporkan kepada kami dengan cara:</p>
        <ul class="faq-list">
          <li>Isi formulir yang tersedia dibawah ini.</li>
          <li>Kirimkan formulir untuk memberi tahu kami tentang ketidaksesuaian tersebut.</li>
        </ul>
        <p class="faq-paragraph">Dengan begitu, Anda telah membantu kami menjaga layanan yang aman dan andal bagi semua pengguna FivGo.</p>
        <p class="faq-paragraph">Keselamatan Anda adalah prioritas kami. Kami menghargai kewaspadaan Anda dalam melaporkan setiap ketidaksesuaian informasi pengemudi atau kendaraan. Mari bersama pastikan pengalaman pemesanan transportasi di aplikasi FivGo yang aman dan terpercaya bagi semua.</p>
      `,
      hasForm: true,
      formType: 'info-tidak-sesuai',
      isOpen: false
    }
  ];

  isBantuanModalOpen = false;
  userEmail = '';
  activeFormType: 'lupa-bayar' | 'tidak-sampai-tujuan' | 'info-tidak-sesuai' | '' = '';

  // Form 1: Lupa Bayar
  formLupaBayar = {
    nominalTunggakan: '',
    metodePembayaran: '',
    description: '',
    isAgreed: false
  };

  // Form 2: Tidak Sampai Tujuan
  formTidakSampaiTujuan = {
    tanggalPerjalanan: '',
    alasanTurun: '',
    description: '',
    isAgreed: false
  };

  // Form 3: Info Tidak Sesuai
  formInfoTidakSesuai = {
    incidentType: '',
    description: '',
    isAgreed: false
  };

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    const user = this.authService.currentUserValue;
    if (user && user.email) {
      this.userEmail = user.email;
    } else {
      this.userEmail = '';
    }
  }

  toggleFaq(index: number) {
    const isCurrentlyOpen = this.faqItems[index].isOpen;
    this.faqItems.forEach((item, idx) => {
      if (idx !== index) {
        item.isOpen = false;
      }
    });
    this.faqItems[index].isOpen = !isCurrentlyOpen;
  }

  async openBantuanForm(formType: 'lupa-bayar' | 'tidak-sampai-tujuan' | 'info-tidak-sesuai') {
    const user = this.authService.currentUserValue;
    if (!user || !user.email) {
      const alert = await this.alertCtrl.create({
        header: 'Email Diperlukan',
        message: 'Silakan tambahkan alamat email Anda di menu Edit Profil terlebih dahulu untuk dapat mengirimkan laporan bantuan.',
        buttons: [
          {
            text: 'Batal',
            role: 'cancel'
          },
          {
            text: 'Tambah Email',
            handler: () => {
              this.navCtrl.navigateForward('/edit-profile');
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    this.userEmail = user.email;
    this.activeFormType = formType;
    this.isBantuanModalOpen = true;

    // Reset semua form
    this.formLupaBayar = { nominalTunggakan: '', metodePembayaran: '', description: '', isAgreed: false };
    this.formTidakSampaiTujuan = { tanggalPerjalanan: '', alasanTurun: '', description: '', isAgreed: false };
    this.formInfoTidakSesuai = { incidentType: '', description: '', isAgreed: false };
  }

  closeBantuanForm() {
    this.isBantuanModalOpen = false;
    this.activeFormType = '';
  }

  updateCharCount() { }

  isFormValid(): boolean {
    if (this.activeFormType === 'lupa-bayar') {
      return (
        this.formLupaBayar.nominalTunggakan.trim() !== '' &&
        this.formLupaBayar.metodePembayaran !== '' &&
        this.formLupaBayar.description.length >= 35 &&
        this.formLupaBayar.isAgreed === true
      );
    } else if (this.activeFormType === 'tidak-sampai-tujuan') {
      return (
        this.formTidakSampaiTujuan.tanggalPerjalanan !== '' &&
        this.formTidakSampaiTujuan.alasanTurun !== '' &&
        this.formTidakSampaiTujuan.description.length >= 35 &&
        this.formTidakSampaiTujuan.isAgreed === true
      );
    } else if (this.activeFormType === 'info-tidak-sesuai') {
      return (
        this.formInfoTidakSesuai.incidentType !== '' &&
        this.formInfoTidakSesuai.description.length >= 35 &&
        this.formInfoTidakSesuai.isAgreed === true
      );
    }
    return false;
  }

  getActiveDescription(): string {
    if (this.activeFormType === 'lupa-bayar') return this.formLupaBayar.description;
    if (this.activeFormType === 'tidak-sampai-tujuan') return this.formTidakSampaiTujuan.description;
    if (this.activeFormType === 'info-tidak-sesuai') return this.formInfoTidakSesuai.description;
    return '';
  }

  async submitBantuanForm() {
    if (this.isFormValid()) {
      this.closeBantuanForm();
      const alert = await this.alertCtrl.create({
        header: 'Laporan Dikirim',
        message: 'Laporan Anda berhasil dikirim. Tim kami akan segera meninjau masalah ini.',
        buttons: [
          {
            text: 'OK',
            role: 'cancel',
            cssClass: 'alert-btn-pengaturan'
          }
        ]
      });
      await alert.present();
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
