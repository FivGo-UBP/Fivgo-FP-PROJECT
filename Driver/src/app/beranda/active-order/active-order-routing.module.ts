import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActiveOrderPage } from './active-order.page';

const routes: Routes = [
  {
    path: '',
    component: ActiveOrderPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ActiveOrderPageRoutingModule {}
