import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KeamananPageRoutingModule } from './keamanan-routing.module';

import { KeamananPage } from './keamanan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KeamananPageRoutingModule
  ],
  declarations: [KeamananPage]
})
export class KeamananPageModule {}
