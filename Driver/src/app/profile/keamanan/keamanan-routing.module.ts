import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KeamananPage } from './keamanan.page';

const routes: Routes = [
  {
    path: '',
    component: KeamananPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KeamananPageRoutingModule {}
