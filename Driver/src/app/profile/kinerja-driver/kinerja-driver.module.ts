import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KinerjaDriverPageRoutingModule } from './kinerja-driver-routing.module';

import { KinerjaDriverPage } from './kinerja-driver.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KinerjaDriverPageRoutingModule
  ],
  declarations: [KinerjaDriverPage]
})
export class KinerjaDriverPageModule {}
