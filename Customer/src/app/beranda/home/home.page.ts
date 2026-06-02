import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: User | null = null;
  selectedPromo: any = null;
  selectedEducation: any = null;
  isCopied: boolean = false;

  promotions: any[] = [
    {
      id: 1,
      image: 'assets/promo_10x_motor.png',
      title: '10x Order FivGO Motor',
      titleEn: '10x Order FivGO Motor',
      desc: 'Dapatkan voucher diskon setelah 10x order FivGO Motor diskon Rp10rb*',
      descEn: 'Get a discount voucher after 10x FivGO Motor orders discount Rp10k*',
      code: 'FIVGOMOTOR10X',
      terms: [
        'Berlaku setelah menyelesaikan 10x pemesanan FivGO Motor.',
        'Potongan langsung sebesar Rp 10.000.',
        'Hanya berlaku untuk layanan FivGO Motor.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Valid after completing 10x FivGO Motor orders.',
        'Direct discount of Rp 10,000.',
        'Only applicable for FivGO Motor service.',
        'Valid until December 31, 2026.'
      ]
    },
    {
      id: 2,
      image: 'assets/promo_mobil.png',
      title: 'Pertama Kali Naik Fivgo Mobil',
      titleEn: 'First Ride Fivgo Mobil',
      desc: 'Pertama kali naik Fivgo mobil mendapatkan voucher diskon Rp8.5rb*',
      descEn: 'First time riding Fivgo Mobil gets a discount voucher of Rp8.5k*',
      code: 'FIVGOMOBILBARU',
      terms: [
        'Hanya berlaku untuk perjalanan pertama kali menggunakan Fivgo Mobil.',
        'Potongan langsung sebesar Rp 8.500.',
        'Hanya berlaku untuk layanan FivgoMobil.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Only applicable for first time riding Fivgo Mobil.',
        'Direct discount of Rp 8,500.',
        'Only applicable for FivgoMobil service.',
        'Valid until December 31, 2026.'
      ]
    },
    {
      id: 3,
      image: 'assets/promo_motor.png',
      title: 'Pertama Kali Naik Fivgo Motor',
      titleEn: 'First Ride Fivgo Motor',
      desc: 'Pertama kali naik Fivgo motor mendapatkan voucher diskon Rp5rb*',
      descEn: 'First time riding Fivgo Motor gets a discount voucher of Rp5k*',
      code: 'FIVGOMOTORBARU',
      terms: [
        'Hanya berlaku untuk perjalanan pertama kali menggunakan Fivgo Motor.',
        'Potongan langsung sebesar Rp 5.000.',
        'Hanya berlaku untuk layanan FivgoMotor.',
        'Berlaku hingga 31 Desember 2026.'
      ],
      termsEn: [
        'Only applicable for first time riding Fivgo Motor.',
        'Direct discount of Rp 5,000.',
        'Only applicable for FivgoMotor service.',
        'Valid until December 31, 2026.'
      ]
    }
  ];

  educations: any[] = [
    {
      id: 1,
      image: 'assets/edukasi_keamanan.png',
      title: 'Aman & Nyaman Bersama Fivgo',
      titleEn: 'Safe & Comfortable with Fivgo',
      desc: 'Keamanan Anda adalah prioritas utama kami. Fivgo berkomitmen menjaga Anda tetap aman di jalan.',
      descEn: 'Your safety is our top priority. Fivgo is committed to keeping you safe on the road.',
      tips: [
        'Pastikan plat nomor dan nama driver sesuai dengan data di aplikasi sebelum Anda naik.',
        'Gunakan fitur "Bagikan Perjalanan" ke keluarga terdekat agar mereka tahu posisi Anda secara langsung.',
        'Jika terjadi situasi mencurigakan, segera gunakan tombol darurat di aplikasi untuk memanggil bantuan.'
      ],
      tipsEn: [
        'Verify the license plate and driver name with the app details before getting on.',
        'Use the "Share Trip" feature to share your live location with your family.',
        'In case of suspicious situations, immediately press the emergency button in the app to call for help.'
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    public langService: LanguageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
    });
  }

  openPromo(promo: any) {
    this.selectedPromo = promo;
    this.isCopied = false;
  }

  openEducation(edu: any) {
    this.selectedEducation = edu;
  }

  copyPromoCode(code: string) {
    navigator.clipboard.writeText(code);
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }

  usePromo(promo: any) {
    this.selectedPromo = null;
    let service = 'motor';
    if (promo.code.includes('MOBIL')) {
      service = 'mobil';
    }
    this.router.navigate(['/prioritas-kendaraan'], { queryParams: { vehicle: service } });
  }

  t(key: string): string {
    return this.langService.translate(key);
  }

  get isIndonesian(): boolean {
    return this.langService.getLanguage() === 'id';
  }
}
