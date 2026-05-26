import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { MenuLoginPageRoutingModule } from './menu-login-routing.module';

import { MenuLoginPage } from './menu-login.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    MenuLoginPageRoutingModule
  ],
  declarations: [MenuLoginPage]
})
export class MenuLoginPageModule {}
