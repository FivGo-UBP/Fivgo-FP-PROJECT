import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormPengajuanPage } from './form-pengajuan.page';

const routes: Routes = [
  {
    path: '',
    component: FormPengajuanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormPengajuanPageRoutingModule {}
