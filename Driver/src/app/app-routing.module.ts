import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'landing-page',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./beranda/tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'aktivasi-lokasi',
    loadChildren: () => import('./aktivasi-lokasi/aktivasi-lokasi.module').then( m => m.AktivasiLokasiPageModule)
  },
  {
    path: 'landing-page',
    loadChildren: () => import('./landing-page/landing-page.module').then( m => m.LandingPagePageModule)
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
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
