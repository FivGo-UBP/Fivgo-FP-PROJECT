import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormTelponLoginPageRoutingModule } from './form-telpon-login-routing.module';

import { FormTelponLoginPage } from './form-telpon-login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormTelponLoginPageRoutingModule
  ],
  declarations: [FormTelponLoginPage]
})
export class FormTelponLoginPageModule {}
