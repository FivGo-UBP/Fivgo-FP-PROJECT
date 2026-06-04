import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LaporanMasalahPageRoutingModule } from './laporan-masalah-routing.module';

import { LaporanMasalahPage } from './laporan-masalah.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LaporanMasalahPageRoutingModule
  ],
  declarations: [LaporanMasalahPage]
})
export class LaporanMasalahPageModule {}
