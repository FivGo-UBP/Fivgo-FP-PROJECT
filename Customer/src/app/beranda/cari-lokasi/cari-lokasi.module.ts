import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CariLokasiPageRoutingModule } from './cari-lokasi-routing.module';

import { CariLokasiPage } from './cari-lokasi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CariLokasiPageRoutingModule
  ],
  declarations: [CariLokasiPage]
})
export class CariLokasiPageModule {}
