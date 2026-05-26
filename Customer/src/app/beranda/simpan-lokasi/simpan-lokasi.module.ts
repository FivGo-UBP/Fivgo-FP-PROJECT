import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SimpanLokasiPageRoutingModule } from './simpan-lokasi-routing.module';

import { SimpanLokasiPage } from './simpan-lokasi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SimpanLokasiPageRoutingModule
  ],
  declarations: [SimpanLokasiPage]
})
export class SimpanLokasiPageModule {}
