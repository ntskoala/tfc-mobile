import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { IncidenciasPage } from './incidencias';

@NgModule({
  declarations: [
    IncidenciasPage,
  ],
  imports: [
  //  IonicModule.forChild(IncidenciasPage),
  ],
  exports: [
    IncidenciasPage
  ]
})
export class IncidenciasPageModule {}
