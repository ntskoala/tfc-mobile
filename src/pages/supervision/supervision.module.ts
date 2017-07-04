import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { SupervisionPage } from './supervision';

@NgModule({
  declarations: [
    SupervisionPage,
  ],
  imports: [
    //IonicModule.forChild(SupervisionPage),
  ],
  exports: [
    SupervisionPage
  ]
})
export class SupervisionPageModule {}
