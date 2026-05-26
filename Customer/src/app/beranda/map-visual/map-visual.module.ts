import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MapVisualPageRoutingModule } from './map-visual-routing.module';

import { MapVisualPage } from './map-visual.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapVisualPageRoutingModule
  ],
  declarations: [MapVisualPage]
})
export class MapVisualPageModule {}
