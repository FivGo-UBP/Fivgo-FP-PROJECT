import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormNamaPage } from './form-nama.page';

const routes: Routes = [
  {
    path: '',
    component: FormNamaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormNamaPageRoutingModule {}
