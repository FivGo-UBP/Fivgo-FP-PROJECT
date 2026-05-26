import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FormNamaPageRoutingModule } from './form-nama-routing.module';

import { FormNamaPage } from './form-nama.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FormNamaPageRoutingModule
  ],
  declarations: [FormNamaPage]
})
export class FormNamaPageModule {}
