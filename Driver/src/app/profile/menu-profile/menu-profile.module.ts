import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MenuProfilePageRoutingModule } from './menu-profile-routing.module';

import { MenuProfilePage } from './menu-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MenuProfilePageRoutingModule
  ],
  declarations: [MenuProfilePage]
})
export class MenuProfilePageModule {}
