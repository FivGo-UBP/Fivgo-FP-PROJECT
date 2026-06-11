import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DaftarAktivitasPageRoutingModule } from './daftar-aktivitas-routing.module';

import { DaftarAktivitasPage } from './daftar-aktivitas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DaftarAktivitasPageRoutingModule
  ],
  declarations: [DaftarAktivitasPage]
})
export class DaftarAktivitasPageModule {}
