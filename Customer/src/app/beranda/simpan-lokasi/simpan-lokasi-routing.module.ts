import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SimpanLokasiPage } from './simpan-lokasi.page';

const routes: Routes = [
  {
    path: '',
    component: SimpanLokasiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimpanLokasiPageRoutingModule {}
