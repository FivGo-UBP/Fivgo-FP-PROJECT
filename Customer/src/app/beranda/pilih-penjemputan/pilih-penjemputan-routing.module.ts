import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PilihPenjemputanPage } from './pilih-penjemputan.page';

const routes: Routes = [
  {
    path: '',
    component: PilihPenjemputanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PilihPenjemputanPageRoutingModule {}
