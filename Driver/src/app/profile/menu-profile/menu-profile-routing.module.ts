import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuProfilePage } from './menu-profile.page';

const routes: Routes = [
  {
    path: '',
    component: MenuProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuProfilePageRoutingModule {}
