import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { KelolaProfilePage } from './kelola-profile.page';

const routes: Routes = [
  {
    path: '',
    component: KelolaProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KelolaProfilePageRoutingModule {}
