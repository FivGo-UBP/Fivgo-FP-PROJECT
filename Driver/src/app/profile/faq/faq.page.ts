import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LanguageService } from '../../services/language.service';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
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
      question: 'Perlindungan Asuransi Mitra Pengemudi Fivgo',
      answer: `
        <p class="faq-paragraph">Setiap perjalanan yang terjadi melalui platform Fivgo dilindungi oleh asuransi kecelakaan diri (Personal Accident/PA) dari FivGo bagi Mitra Pengemudi yang aktif di indonesia. Cakupan kebijakan asuransi ini hanya berlaku di wilayah indonesia</p>
        <h4 class="faq-subheading">Syarat & Ketentuan Asuransi</h4>
        <ul class="faq-list">
          <li>Usia 18-60 tahun</li>
          <li>Mitra harus dalam keadaan menerima layanan atau pemesanan aktif</li>
          <li>memakai alat keselamatan berkendara</li>
            <ul class="faq-list">
              <li>FivGoBike: Helm sesuai standar SNI lengkap</li>
              <li>FivgoCar: Menggunakan sabuk pengaman</li>
            </ul>
          <li>Menggunakan kendaraan dan pelat nomor sesuai yang terdaftar di aplikasi</li>
          <li>KTP, SIM, STNK aktif</li>
          <li><strong>Ketentuan pelaporan:</strong></li>
            <ul class="faq-list">
              <li>Insiden/Kecelakaaan : <strong>Laporan dilakukan selambatnya 3×24 jam </strong>setelah insiden terjadi</li>
              <li>Kematian : <strong>Laporan dilakukan selambatnya 7×24 jam </strong>dari tanggal korban dinyatakan meninggal dunia</li>
            </ul>
        </ul>
        <p class="faq-paragraph">Pelaporan awal kecelakaan dapat dilakukan melalui:</p>
        <ul class="faq-list">
          <li>Pusat Bantuan Fivgo</li>
          <li>WhatsApp: +62 895-0185-8234</li>
        </ul>
      `,
      isOpen: false
    },
    {
      question: 'Jarak tempuh orderan terlalu jauh',
      answer: `
        <p class="faq-paragraph">Kami mengerti bahwa terkadang jarak tempuh orderan bisa menjadi tantangan. Sesuai kode etik FivGo, Anda disarankan untuk selalu menjemput penumpang dan menyelesaikan setiap orderan yang masuk.</p>
        <p class="faq-paragraph">Namun, jika lokasi penumpang terlalu jauh,berikut langkah-langkah yang bisa dilakukan:</p>
        <ul class="faq-list">
          <li><strong>Chat pelanggan</strong> dan tanyakan apakah mereka bersedia menunggu.</li>
          <li>Jika pelanggan bersedia, jemput dan selesaikan orderan seperti biasa.</li>
          <li>Jika pelanggan tidak bersedia menunggu,<strong>batalkan orderan</strong> dengan alasan yang tepat.</li>
        </ul>
      `,
      isOpen: false
    },
    {
      question: 'Tidak bisa batalkan perjalanan',
      answer: `
        <p class="faq-paragraph">Sepertinya ada kesalahan dalam perjalanan Anda. Jika Anda menyelesaikan perjalanan tanpa menjemput penumpang, silahkan beri tahu kami melalui Customer Service di halaman Pusat Bantuan.</p>
        <p class="faq-paragraph">Mohon pengertiannya bahwa proses pengembalian dana dan penyesuaian komisi mungkin memerlukan beberpa hari. Kami juga akan terus memberikan informasi terbaru kepada Anda selama proses berlangsung</p>
      `,
      isOpen: false
    },
    {
      question: 'Titik jemput tidak bisa dilalui',
      answer: `
        <p class="faq-paragraph">Jika titik jemput penumpang tidak mungkin Anda lalui berikut langkah yang bisa Anda lakukan :</p>
        <ul class="faq-list">
          <li>Hubungi penumpang, infokan kondisinya</li>
          <li>Minta alternatif titik jemput lain</li>
        </ul>
        <p class="faq-paragraph">Jika penumpang tidak bersedia memberikan alternatif titik jemput lain, Anda bisa batalkan orderan tersebut dengan cara :</p>
        <ul class="faq-list">
          <li>Tekan tombol <strong>Batalkan Pesanan</strong></li>
          <li>Pilih alasan <strong>"Penumpang tidak muncul/Penumpang tidak bisa dihubungi"</strong></li>
        </ul>
        <p class="faq-paragraph">Pembatalan dengan alasan "Penumpang tidak muncul" tidak akan pengaruhi performa</p>
      `,
      isOpen: false
    },
    {
      question: 'Penumpang bersikap kasar',
      answer: `
        <p class="faq-paragraph">Kami sangat menyesal mendengar pengalaman Anda dengan penumpang yang bersikap kasar. Keselamatan Anda adalah prioritas utama FivGo, dan kami ingin membantu Anda menangani situasi ini dengan efektif.</p>
        <h4 class="faq-subheading">Jika penumpang bersikap kasar</h4>
        <p class="faq-paragraph">Tetap tenang dan profesional. Hindari berdebat dengan penumpang dan fokus selesaikan perjalanan dengan aman. Setelah perjalanan selesai, Anda dapat memberi penilaian kepada penumpang tersebut sesuai dengan pengalaman Anda.</p>
        <h4 class="faq-subheading">Jika keselamatan terancam</h4>
        <p class="faq-paragraph">Pergi ke area yang aman dengan banyak orang di sekitar. Dengan sopan, minta penumpang untuk meninggalkan kendaraan. Jika dia menolak, prioritaskan keselamatan Anda dengan menjauh dari kendaraan sambil membawa kunci.</p>
        <p class="faq-paragraph">Segera hubungi polisi di 110 atau kantor polisi terdekat dan laporkan insiden tersebut. Kami sangat menyarankan Anda untuk melampirkan foto atau video sebagai bukti jika tersedia.</p>
      `,
      isOpen: false
    }
  ];

  constructor(
    private navCtrl: NavController,
    public langService: LanguageService
  ) { }

  ngOnInit() { }

  toggleFaq(index: number) {
    const isCurrentlyOpen = this.faqItems[index].isOpen;
    this.faqItems.forEach((item, idx) => {
      if (idx !== index) {
        item.isOpen = false;
      }
    });
    this.faqItems[index].isOpen = !isCurrentlyOpen;
  }

  goBack() {
    this.navCtrl.navigateBack('/bantuan');
  }

  t(key: string): string {
    return this.langService.translate(key);
  }
}
