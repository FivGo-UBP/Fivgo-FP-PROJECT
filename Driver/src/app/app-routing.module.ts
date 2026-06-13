import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { locationGuard } from './guards/location.guard';
import { welcomeGuard } from './guards/welcome.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome-page',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./beranda/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [locationGuard]
  },
  {
    path: 'aktivasi-lokasi',
    loadChildren: () => import('./aktivasi-lokasi/aktivasi-lokasi.module').then( m => m.AktivasiLokasiPageModule)
  },
  {
    path: 'welcome-page',
    loadChildren: () => import('./welcome-page/welcome-page.module').then( m => m.WelcomePagePageModule),
    canActivate: [welcomeGuard, locationGuard]
  },
  {
    path: 'landing-page',
    redirectTo: 'welcome-page',
    pathMatch: 'full'
  },
  {
    path: 'menu-login',
    loadChildren: () => import('./auth/menu-login/menu-login.module').then( m => m.MenuLoginPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'kode-otp-login',
    loadChildren: () => import('./auth/kode-otp-login/kode-otp-login.module').then( m => m.KodeOtpLoginPageModule)
  },
  {
    path: 'form-telpon-login',
    loadChildren: () => import('./auth/form/form-telpon-login/form-telpon-login.module').then( m => m.FormTelponLoginPageModule)
  },
  {
    path: 'menu-profile',
    loadChildren: () => import('./profile/menu-profile/menu-profile.module').then( m => m.MenuProfilePageModule)
  },
  {
    path: 'edit-profile',
    loadChildren: () => import('./profile/edit-profile/edit-profile.module').then( m => m.EditProfilePageModule)
  },
  {
    path: 'order-detail/:id',
    loadChildren: () => import('./beranda/order-detail/order-detail.module').then( m => m.OrderDetailPageModule)
  },
  {
    path: 'active-order/:id',
    loadChildren: () => import('./beranda/active-order/active-order.module').then( m => m.ActiveOrderPageModule)
  },
  {
    path: 'kinerja-driver',
    loadChildren: () => import('./profile/kinerja-driver/kinerja-driver.module').then( m => m.KinerjaDriverPageModule)
  },
  {
    path: 'ganti-nomor',
    loadChildren: () => import('./profile/ganti-nomor/ganti-nomor.module').then( m => m.GantiNomorPageModule)
  },
  {
    path: 'order-summary/:id',
    loadChildren: () => import('./beranda/order-summary/order-summary.module').then( m => m.OrderSummaryPageModule)
  },
  {
    path: 'transaction-detail/:id',
    loadChildren: () => import('./beranda/transaction-detail/transaction-detail.module').then( m => m.TransactionDetailPageModule)
  },
  {
    path: 'keamanan',
    loadChildren: () => import('./profile/keamanan/keamanan.module').then( m => m.KeamananPageModule)
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
    path: 'form-pengajuan',
    loadChildren: () => import('./profile/form-pengajuan/form-pengajuan.module').then( m => m.FormPengajuanPageModule)
  },
  {
    path: 'faq',
    loadChildren: () => import('./profile/faq/faq.module').then( m => m.FaqPageModule)
  },
  {
    path: 'laporan-masalah',
    loadChildren: () => import('./profile/laporan-masalah/laporan-masalah.module').then( m => m.LaporanMasalahPageModule)
  },
  {
    path: 'chatbot-bantuan',
    loadChildren: () => import('./profile/chatbot-bantuan/chatbot-bantuan.module').then( m => m.ChatbotBantuanPageModule)
  },
  {
    path: 'daftar-aktivitas',
    loadChildren: () => import('./profile/daftar-aktivitas/daftar-aktivitas.module').then( m => m.DaftarAktivitasPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
