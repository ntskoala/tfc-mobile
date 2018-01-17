import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { MCorrectivoPage } from './m-correctivo';

@NgModule({
  declarations: [
    MCorrectivoPage,
  ],
  imports: [
   // IonicModule.forChild(MCorrectivoPage),
  ],
  exports: [
    MCorrectivoPage
  ]
})
export class MCorrectivoPageModule {}
