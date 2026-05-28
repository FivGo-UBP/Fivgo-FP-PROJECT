import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RatingDriverPageRoutingModule } from './rating-driver-routing.module';

import { RatingDriverPage } from './rating-driver.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RatingDriverPageRoutingModule
  ],
  declarations: [RatingDriverPage]
})
export class RatingDriverPageModule {}
