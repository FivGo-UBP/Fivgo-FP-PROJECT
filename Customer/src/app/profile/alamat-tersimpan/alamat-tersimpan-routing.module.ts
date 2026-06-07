import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlamatTersimpanPage } from './alamat-tersimpan.page';

const routes: Routes = [
  {
    path: '',
    component: AlamatTersimpanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AlamatTersimpanPageRoutingModule {}
