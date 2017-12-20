import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { MantenimientoPage } from './mantenimiento';

@NgModule({
  declarations: [
    MantenimientoPage,
  ],
  imports: [
   // IonicModule.forChild(MantenimientoPage),
  ],
  exports: [
    MantenimientoPage
  ]
})
export class MantenimientoPageModule {}
