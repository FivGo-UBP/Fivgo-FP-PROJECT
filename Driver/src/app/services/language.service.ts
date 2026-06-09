import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LanguageType = 'id' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = new BehaviorSubject<LanguageType>('id');
  currentLang$ = this.currentLang.asObservable();

  private translations: any = {
    id: {
      'profile.title': 'Profil',
      'profile.edit': 'Edit Profile',
      'profile.phone.empty': 'Belum ada nomor telepon',
      'profile.email.empty': 'Belum ada email',
      'menu.security': 'Keamanan',
      'menu.activity': 'Aktivitas',
      'menu.address': 'Alamat',
      'menu.promo': 'Promo',
      'menu.language': 'Bahasa',
      'menu.help': 'Bantuan',
      'menu.logout': 'Keluar',
      'lang.id': 'Bahasa Indonesia',
      'lang.en': 'English',
      'alert.logout.title': 'Konfirmasi Keluar',
      'alert.logout.msg': 'Apakah Anda yakin ingin keluar?',
      'alert.cancel': 'Batal',
      'alert.yes': 'Ya, Keluar',
      'activity.title': 'Aktivitas',
      'activity.search.placeholder': 'Cari riwayat pesanan...',
      'activity.filter.vehicle': 'Kendaraan',
      'activity.filter.status': 'Status',
      'activity.filter.time': 'Waktu',
      'activity.filter.reset': 'Semua',
      'activity.empty.title': 'Riwayat Aktivitas Kosong',
      'activity.empty.desc': 'Anda belum pernah melakukan pemesanan. Silakan kembali ke Beranda untuk mulai memesan layanan.',
      'activity.notfound.title': 'Pencarian Tidak Ditemukan',
      'activity.notfound.desc': 'Cari dengan kata kunci lain atau hapus filter.',
      'activity.status.completed': 'Selesai',
      'activity.status.cancelled': 'Dibatalkan',
      'activity.status.rejected': 'Ditolak',
      'activity.vehicle.car': 'Mobil',
      'activity.vehicle.motor': 'Motor',
      'activity.time.today': 'Hari ini',
      'activity.time.week': 'Minggu ini',
      'activity.time.month': 'Bulan ini',
      'activity.order_again': 'pesan lagi',
      'home.search': 'Mau pergi kemana?',
      'home.education': 'Edukasi & kemanan',
      'home.promotion': 'promosi',
      'tabs.home': 'Beranda',
      'tabs.activity': 'Aktivitas',
      'tabs.message': 'Pesan',
      'tabs.payment': 'Pembayaran',
      'bahasa.title': 'Pengaturan Bahasa',
      'bahasa.subtitle': 'pilih bahasa yang ingin Anda gunakan dalam aplikasi',
      'bahasa.save': 'Simpan Perubahan',
      'chat.title': 'Pesan',
      'chat.tab.chat': 'Chat',
      'chat.tab.notif': 'Notifikasi',
      'chat.search': 'Cari Pesan atau driver',
      'chat.empty.notif': 'Belum ada notifikasi.',
      'editprofile.title': 'Edit Profil',
      'editprofile.fullname': 'Nama Lengkap',
      'editprofile.email': 'Email',
      'editprofile.phone': 'Nomor Telepon',
      'editprofile.locked': 'Terkunci',
      'editprofile.empty.phone': 'Belum ada nomor',
      'editprofile.change': 'Ganti',
      'editprofile.otp_hint': 'Perubahan nomor memerlukan verifikasi OTP',
      'editprofile.gender': 'Jenis Kelamin',
      'editprofile.save': 'Simpan Perubahan',
      'editprofile.modal.title': 'Apa jenis kelaminmu?',
      'editprofile.modal.desc': 'Ini akan membantu kami menyesuaikan dan meningkatkan pengalaman pengguna.',
      'editprofile.gender.female': 'Perempuan',
      'editprofile.gender.male': 'Laki-laki',
      'editprofile.gender.other': 'Tidak ingin menyebutkan',
      'editprofile.modal.footer': 'Untuk alasan keamanan, kami dapat melakukan pengecekan secara berkala terkait informasi yang kamu berikan saat ini dengan informasi yang tersimpan pada sistem kami',
      'editprofile.toast.success': 'Profil berhasil diperbarui!',
      'editprofile.toast.error': 'Gagal memperbarui profil.',
      'exit.alert.title': 'Keluar Aplikasi',
      'exit.alert.msg': 'Apakah Anda yakin ingin keluar dari aplikasi FivGo?',
      'exit.alert.cancel': 'Batal',
      'exit.alert.confirm': 'Keluar',
      'bantuan.title': 'Pusat Bantuan'
    },
    en: {
      'profile.title': 'Profile',
      'profile.edit': 'Edit Profile',
      'profile.phone.empty': 'No phone number yet',
      'profile.email.empty': 'No email yet',
      'menu.security': 'Security',
      'menu.activity': 'Activity',
      'menu.address': 'Address',
      'menu.promo': 'Promo',
      'menu.language': 'Language',
      'menu.help': 'Help',
      'menu.logout': 'Logout',
      'lang.id': 'Indonesian',
      'lang.en': 'English',
      'alert.logout.title': 'Logout Confirmation',
      'alert.logout.msg': 'Are you sure you want to logout?',
      'alert.cancel': 'Cancel',
      'alert.yes': 'Yes, Logout',
      'activity.title': 'Activity',
      'activity.search.placeholder': 'Search order history...',
      'activity.filter.vehicle': 'Vehicle',
      'activity.filter.status': 'Status',
      'activity.filter.time': 'Time',
      'activity.filter.reset': 'All',
      'activity.empty.title': 'Activity History Empty',
      'activity.empty.desc': 'You haven\'t made any bookings yet. Please return to Home to start ordering services.',
      'activity.notfound.title': 'No Search Results',
      'activity.notfound.desc': 'Try another keyword or clear filters.',
      'activity.status.completed': 'Completed',
      'activity.status.cancelled': 'Cancelled',
      'activity.status.rejected': 'Rejected',
      'activity.vehicle.car': 'Car',
      'activity.vehicle.motor': 'Motorcycle',
      'activity.time.today': 'Today',
      'activity.time.week': 'This week',
      'activity.time.month': 'This month',
      'activity.order_again': 'Order again',
      'home.search': 'Where do you want to go?',
      'home.education': 'Education & Security',
      'home.promotion': 'Promotion',
      'tabs.home': 'Home',
      'tabs.activity': 'Activity',
      'tabs.message': 'Message',
      'tabs.payment': 'Payment',
      'bahasa.title': 'Language Settings',
      'bahasa.subtitle': 'select the language you want to use in the application',
      'bahasa.save': 'Save Changes',
      'chat.title': 'Messages',
      'chat.tab.chat': 'Chat',
      'chat.tab.notif': 'Notifications',
      'chat.search': 'Search message or driver',
      'chat.empty.notif': 'No notifications yet.',
      'editprofile.title': 'Edit Profile',
      'editprofile.fullname': 'Full Name',
      'editprofile.email': 'Email',
      'editprofile.phone': 'Phone Number',
      'editprofile.locked': 'Locked',
      'editprofile.empty.phone': 'No number yet',
      'editprofile.change': 'Change',
      'editprofile.otp_hint': 'Number change requires OTP verification',
      'editprofile.gender': 'Gender',
      'editprofile.save': 'Save Changes',
      'editprofile.modal.title': 'What is your gender?',
      'editprofile.modal.desc': 'This will help us customize and improve the user experience.',
      'editprofile.gender.female': 'Female',
      'editprofile.gender.male': 'Male',
      'editprofile.gender.other': 'Prefer not to say',
      'editprofile.modal.footer': 'For security reasons, we may periodically check the information you provide with the information stored in our system',
      'editprofile.toast.success': 'Profile updated successfully!',
      'editprofile.toast.error': 'Failed to update profile.',
      'exit.alert.title': 'Exit Application',
      'exit.alert.msg': 'Are you sure you want to exit the FivGo application?',
      'exit.alert.cancel': 'Cancel',
      'exit.alert.confirm': 'Exit',
      'bantuan.title': 'Help Center'
    }
  };

  constructor() {
    const savedLang = localStorage.getItem('app_lang') as LanguageType;
    if (savedLang) {
      this.currentLang.next(savedLang);
    }
  }

  setLanguage(lang: LanguageType) {
    this.currentLang.next(lang);
    localStorage.setItem('app_lang', lang);
  }

  getLanguage(): LanguageType {
    return this.currentLang.value;
  }

  translate(key: string): string {
    const lang = this.currentLang.value;
    return this.translations[lang][key] || key;
  }
}
