import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AktivasiLokasiPageRoutingModule } from './aktivasi-lokasi-routing.module';

import { AktivasiLokasiPage } from './aktivasi-lokasi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AktivasiLokasiPageRoutingModule
  ],
  declarations: [AktivasiLokasiPage]
})
export class AktivasiLokasiPageModule {}
