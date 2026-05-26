import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CariLokasiPage } from './cari-lokasi.page';

const routes: Routes = [
  {
    path: '',
    component: CariLokasiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CariLokasiPageRoutingModule {}
