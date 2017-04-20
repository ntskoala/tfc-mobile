import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TraspasosPage } from './traspasos';

import {BrowserModule} from "@angular/platform-browser";
import {HttpModule,Http} from '@angular/http';
import {TranslateModule,TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';

export function createTranslateLoader(http: Http) {
    //return new TranslateStaticLoader(http, '../../assets/i18n', '.json');
    return new TranslateStaticLoader(http, './assets/i18n', '.json');
}


@NgModule({
  declarations: [
    TraspasosPage,
  ],
  imports: [
            TranslateModule.forRoot({ 
          provide: TranslateLoader,
          //useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
          useFactory: (createTranslateLoader),
          deps: [Http]
        }),
    IonicPageModule.forChild(TraspasosPage),
  ],
  exports: [
    TraspasosPage,
    TranslateModule
  ]
})
export class TraspasosModule {}
