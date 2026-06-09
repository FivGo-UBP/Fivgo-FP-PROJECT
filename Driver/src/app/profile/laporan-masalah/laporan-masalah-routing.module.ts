import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LaporanMasalahPage } from './laporan-masalah.page';

const routes: Routes = [
  {
    path: '',
    component: LaporanMasalahPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LaporanMasalahPageRoutingModule {}
