import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AktivasiLokasiPage } from './aktivasi-lokasi.page';

const routes: Routes = [
  {
    path: '',
    component: AktivasiLokasiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AktivasiLokasiPageRoutingModule {}
