import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormTelponDaftarPage } from './form-telpon-daftar.page';

const routes: Routes = [
  {
    path: '',
    component: FormTelponDaftarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormTelponDaftarPageRoutingModule {}
