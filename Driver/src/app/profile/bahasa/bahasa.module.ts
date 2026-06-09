import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BahasaPageRoutingModule } from './bahasa-routing.module';

import { BahasaPage } from './bahasa.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BahasaPageRoutingModule
  ],
  declarations: [BahasaPage]
})
export class BahasaPageModule {}
