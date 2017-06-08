import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { CheckLimpiezaPage } from './check-limpieza';



@NgModule({
  declarations: [
    CheckLimpiezaPage,
  ],
  imports: [
    //IonicPageModule.forChild(CheckLimpiezaPage),
  ],
  exports: [
    CheckLimpiezaPage
  ]
})
export class CheckLimpiezaPageModule {

  }

