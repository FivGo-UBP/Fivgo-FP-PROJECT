import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CsChatPageRoutingModule } from './cs-chat-routing.module';

import { CsChatPage } from './cs-chat.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CsChatPageRoutingModule
  ],
  declarations: [CsChatPage]
})
export class CsChatPageModule {}
