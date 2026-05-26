import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ActiveOrderPageRoutingModule } from './active-order-routing.module';
import { ActiveOrderPage } from './active-order.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActiveOrderPageRoutingModule
  ],
  declarations: [ActiveOrderPage]
})
export class ActiveOrderPageModule {}
