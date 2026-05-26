import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PilihPenjemputanPageRoutingModule } from './pilih-penjemputan-routing.module';

import { PilihPenjemputanPage } from './pilih-penjemputan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PilihPenjemputanPageRoutingModule
  ],
  declarations: [PilihPenjemputanPage]
})
export class PilihPenjemputanPageModule {}
