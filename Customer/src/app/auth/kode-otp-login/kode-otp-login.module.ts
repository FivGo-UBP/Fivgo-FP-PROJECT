import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KodeOtpLoginPageRoutingModule } from './kode-otp-login-routing.module';

import { KodeOtpLoginPage } from './kode-otp-login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KodeOtpLoginPageRoutingModule
  ],
  declarations: [KodeOtpLoginPage]
})
export class KodeOtpLoginPageModule {}
