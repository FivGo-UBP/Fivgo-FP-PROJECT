import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KinerjaDriverPage } from './kinerja-driver.page';

const routes: Routes = [
  {
    path: '',
    component: KinerjaDriverPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KinerjaDriverPageRoutingModule {}
