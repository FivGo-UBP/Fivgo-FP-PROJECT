import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormPengajuanPageRoutingModule } from './form-pengajuan-routing.module';

import { FormPengajuanPage } from './form-pengajuan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormPengajuanPageRoutingModule
  ],
  declarations: [FormPengajuanPage]
})
export class FormPengajuanPageModule {}
