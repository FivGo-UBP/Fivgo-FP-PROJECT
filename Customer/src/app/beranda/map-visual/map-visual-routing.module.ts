import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MapVisualPage } from './map-visual.page';

const routes: Routes = [
  {
    path: '',
    component: MapVisualPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MapVisualPageRoutingModule {}
