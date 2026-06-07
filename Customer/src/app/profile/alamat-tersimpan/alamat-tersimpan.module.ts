import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AlamatTersimpanPageRoutingModule } from './alamat-tersimpan-routing.module';

import { AlamatTersimpanPage } from './alamat-tersimpan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AlamatTersimpanPageRoutingModule
  ],
  declarations: [AlamatTersimpanPage]
})
export class AlamatTersimpanPageModule {}
