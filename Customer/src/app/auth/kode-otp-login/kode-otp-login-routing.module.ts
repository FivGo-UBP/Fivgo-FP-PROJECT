import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KodeOtpLoginPage } from './kode-otp-login.page';

const routes: Routes = [
  {
    path: '',
    component: KodeOtpLoginPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KodeOtpLoginPageRoutingModule {}
