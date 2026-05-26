import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrioritasKendaraanPage } from './prioritas-kendaraan.page';

const routes: Routes = [
  {
    path: '',
    component: PrioritasKendaraanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrioritasKendaraanPageRoutingModule {}
