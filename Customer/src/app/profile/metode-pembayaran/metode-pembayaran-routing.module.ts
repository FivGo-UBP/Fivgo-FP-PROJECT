import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MetodePembayaranPage } from './metode-pembayaran.page';

const routes: Routes = [
  {
    path: '',
    component: MetodePembayaranPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MetodePembayaranPageRoutingModule {}
