import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KodeotpPage } from './kodeotp.page';

const routes: Routes = [
  {
    path: '',
    component: KodeotpPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KodeotpPageRoutingModule {}
