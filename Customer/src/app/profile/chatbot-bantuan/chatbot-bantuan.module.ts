import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ChatbotBantuanPageRoutingModule } from './chatbot-bantuan-routing.module';
import { ChatbotBantuanPage } from './chatbot-bantuan.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChatbotBantuanPageRoutingModule
  ],
  declarations: [ChatbotBantuanPage]
})
export class ChatbotBantuanPageModule {}
