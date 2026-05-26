import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrioritasKendaraanPageRoutingModule } from './prioritas-kendaraan-routing.module';

import { PrioritasKendaraanPage } from './prioritas-kendaraan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrioritasKendaraanPageRoutingModule
  ],
  declarations: [PrioritasKendaraanPage]
})
export class PrioritasKendaraanPageModule {}
