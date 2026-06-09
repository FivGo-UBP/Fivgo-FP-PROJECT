import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BahasaPage } from './bahasa.page';

const routes: Routes = [
  {
    path: '',
    component: BahasaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BahasaPageRoutingModule {}
