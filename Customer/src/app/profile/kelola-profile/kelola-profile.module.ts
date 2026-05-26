import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { KelolaProfilePageRoutingModule } from './kelola-profile-routing.module';

import { KelolaProfilePage } from './kelola-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    KelolaProfilePageRoutingModule
  ],
  declarations: [KelolaProfilePage]
})
export class KelolaProfilePageModule {}
