import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MetodePembayaranPageRoutingModule } from './metode-pembayaran-routing.module';
import { MetodePembayaranPage } from './metode-pembayaran.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetodePembayaranPageRoutingModule
  ],
  declarations: [MetodePembayaranPage]
})
export class MetodePembayaranPageModule {}
