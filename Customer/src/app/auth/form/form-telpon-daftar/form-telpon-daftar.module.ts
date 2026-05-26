import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormTelponDaftarPageRoutingModule } from './form-telpon-daftar-routing.module';

import { FormTelponDaftarPage } from './form-telpon-daftar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormTelponDaftarPageRoutingModule
  ],
  declarations: [FormTelponDaftarPage]
})
export class FormTelponDaftarPageModule {}
