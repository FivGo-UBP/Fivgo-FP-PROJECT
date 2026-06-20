import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CsChatPage } from './cs-chat.page';

const routes: Routes = [
  {
    path: '',
    component: CsChatPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CsChatPageRoutingModule {}
