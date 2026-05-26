import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MenuLoginPage } from './menu-login.page';

const routes: Routes = [
  {
    path: '',
    component: MenuLoginPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MenuLoginPageRoutingModule {}
