import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { locationGuard } from './guards/location.guard';
import { welcomeGuard } from './guards/welcome.guard';

const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./beranda/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [locationGuard]
  },
  {
    path: 'home',
    redirectTo: 'tabs/beranda',
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'welcome-page',
    pathMatch: 'full'
  },
  {
    path: 'landing-page',
    redirectTo: 'welcome-page',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'menu-login',
    loadChildren: () => import('./auth/menu-login/menu-login.module').then( m => m.MenuLoginPageModule)
  },
  {
    path: 'form-telpon-login',
    loadChildren: () => import('./auth/form/form-telpon-login/form-telpon-login.module').then( m => m.FormTelponLoginPageModule)
  },
  {
    path: 'kodeotp',
    loadChildren: () => import('./auth/kodeotp/kodeotp.module').then( m => m.KodeotpPageModule)
  },
  {
    path: 'form-nama',
    loadChildren: () => import('./auth/form/form-nama/form-nama.module').then( m => m.FormNamaPageModule)
  },
  {
    path: 'form-telpon-daftar',
    loadChildren: () => import('./auth/form/form-telpon-daftar/form-telpon-daftar.module').then( m => m.FormTelponDaftarPageModule)
  },
  {
    path: 'aktivasi-lokasi',
    loadChildren: () => import('./aktivasi-lokasi/aktivasi-lokasi.module').then( m => m.AktivasiLokasiPageModule)
  },
  {
    path: 'kode-otp-login',
    loadChildren: () => import('./auth/kode-otp-login/kode-otp-login.module').then( m => m.KodeOtpLoginPageModule)
  },
  {
    path: 'kelola-profile',
    loadChildren: () => import('./profile/kelola-profile/kelola-profile.module').then( m => m.KelolaProfilePageModule)
  },
  {
    path: 'edit-profile',
    loadChildren: () => import('./profile/edit-profile/edit-profile.module').then( m => m.EditProfilePageModule)
  },

  {
    path: 'bahasa',
    loadChildren: () => import('./profile/bahasa/bahasa.module').then( m => m.BahasaPageModule)
  },
  {
    path: 'bantuan',
    loadChildren: () => import('./profile/bantuan/bantuan.module').then( m => m.BantuanPageModule)
  },
  {
    path: 'keamanan',
    loadChildren: () => import('./profile/keamanan/keamanan.module').then( m => m.KeamananPageModule)
  },
  {
    path: 'promo',
    loadChildren: () => import('./profile/promo/promo.module').then( m => m.PromoPageModule)
  },
  {
    path: 'ganti-nomor',
    loadChildren: () => import('./profile/ganti-nomor/ganti-nomor.module').then( m => m.GantiNomorPageModule)
  },
  {
    path: 'order',
    loadChildren: () => import('./beranda/order/order.module').then( m => m.OrderPageModule)
  },
  {
    path: 'order-detail/:id',
    loadChildren: () => import('./beranda/order-detail/order-detail.module').then( m => m.OrderDetailPageModule)
  },
  {
    path: 'prioritas-kendaraan',
    loadChildren: () => import('./beranda/prioritas-kendaraan/prioritas-kendaraan.module').then( m => m.PrioritasKendaraanPageModule)
  },
  {
    path: 'cari-lokasi',
    loadChildren: () => import('./beranda/cari-lokasi/cari-lokasi.module').then( m => m.CariLokasiPageModule)
  },
  {
    path: 'pilih-penjemputan',
    loadChildren: () => import('./beranda/pilih-penjemputan/pilih-penjemputan.module').then( m => m.PilihPenjemputanPageModule)
  },
  {
    path: 'simpan-lokasi',
    loadChildren: () => import('./beranda/simpan-lokasi/simpan-lokasi.module').then( m => m.SimpanLokasiPageModule)
  },
  {
    path: 'map-visual',
    loadChildren: () => import('./beranda/map-visual/map-visual.module').then( m => m.MapVisualPageModule)
  },
  {
    path: 'metode-pembayaran',
    loadChildren: () => import('./profile/metode-pembayaran/metode-pembayaran.module').then( m => m.MetodePembayaranPageModule)
  },
  {
    path: 'rating-driver',
    loadChildren: () => import('./beranda/rating-driver/rating-driver.module').then( m => m.RatingDriverPageModule)
  },
  {
    path: 'faq',
    loadChildren: () => import('./profile/faq/faq.module').then( m => m.FAQPageModule)
  },
  {
    path: 'laporan-masalah',
    loadChildren: () => import('./profile/laporan-masalah/laporan-masalah.module').then( m => m.LaporanMasalahPageModule)
  },
  {
    path: 'welcome-page',
    loadChildren: () => import('./welcome-page/welcome-page.module').then( m => m.WelcomePagePageModule),
    canActivate: [welcomeGuard, locationGuard]
  },
  {
    path: 'alamat-tersimpan',
    loadChildren: () => import('./profile/alamat-tersimpan/alamat-tersimpan.module').then( m => m.AlamatTersimpanPageModule)
  },
  {
    path: 'chatbot-bantuan',
    loadChildren: () => import('./profile/chatbot-bantuan/chatbot-bantuan.module').then( m => m.ChatbotBantuanPageModule)
  },  {
    path: 'daftar-aktivitas',
    loadChildren: () => import('./profile/daftar-aktivitas/daftar-aktivitas.module').then( m => m.DaftarAktivitasPageModule)
  },
  {
    path: 'cs-chat',
    loadChildren: () => import('./profile/cs-chat/cs-chat.module').then( m => m.CsChatPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
