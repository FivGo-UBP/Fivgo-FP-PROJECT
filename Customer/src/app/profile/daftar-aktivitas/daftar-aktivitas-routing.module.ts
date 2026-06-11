import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DaftarAktivitasPage } from './daftar-aktivitas.page';

const routes: Routes = [
  {
    path: '',
    component: DaftarAktivitasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DaftarAktivitasPageRoutingModule {}
