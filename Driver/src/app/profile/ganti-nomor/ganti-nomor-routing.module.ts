import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GantiNomorPage } from './ganti-nomor.page';

const routes: Routes = [
  {
    path: '',
    component: GantiNomorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GantiNomorPageRoutingModule {}
