import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GantiNomorPageRoutingModule } from './ganti-nomor-routing.module';

import { GantiNomorPage } from './ganti-nomor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GantiNomorPageRoutingModule
  ],
  declarations: [GantiNomorPage]
})
export class GantiNomorPageModule {}
