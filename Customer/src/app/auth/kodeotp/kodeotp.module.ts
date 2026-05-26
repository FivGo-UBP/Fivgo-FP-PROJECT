import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KodeotpPageRoutingModule } from './kodeotp-routing.module';

import { KodeotpPage } from './kodeotp.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KodeotpPageRoutingModule
  ],
  declarations: [KodeotpPage]
})
export class KodeotpPageModule {}
