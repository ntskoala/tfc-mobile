import { NgModule } from '@angular/core';
import { IonicApp, IonicModule } from 'ionic-angular';
//**** PLUGINS */
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Network } from '@ionic-native/network';
import { Camera } from '@ionic-native/camera';
import { SocialSharing } from '@ionic-native/social-sharing';
import { StatusBar } from '@ionic-native/status-bar';

//*** MY COMPONENTS */
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import {LoginPage} from '../pages/login/login';
import{ControlPage} from '../pages/control/control';
import{CheckPage} from '../pages/check/check';
import { SyncPage } from '../pages/sync/sync';
import { Config } from '../pages/config/config';
import { Empresa } from '../pages/empresa/empresa';
import { CheckLimpiezaPage } from '../pages/check-limpieza/check-limpieza'
import { SupervisionPage } from '../pages/supervision/supervision'
//import { Tanques } from '../pages/tanques/tanques';
//import { TraspasosPage } from '../pages/traspasos/traspasos';
import { Initdb } from '../providers/initdb';
import { Sync } from '../providers/sync';
import { Servidor } from '../providers/servidor';

import {BrowserModule} from "@angular/platform-browser";
import {HttpModule,Http} from '@angular/http';
import {TranslateModule,TranslateLoader, TranslateStaticLoader } from 'ng2-translate/ng2-translate';

export function createTranslateLoader(http: Http) {
    return new TranslateStaticLoader(http, './assets/i18n', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    LoginPage,
    ControlPage,
    CheckPage,
    CheckLimpiezaPage,
    SupervisionPage,
    SyncPage,
    Config,
    Empresa
  ],
  imports: [
        BrowserModule,
        HttpModule,
        TranslateModule.forRoot({ 
          provide: TranslateLoader,
          //useFactory: (http: Http) => new TranslateStaticLoader(http, 'assets/i18n', '.json'),
          useFactory: (createTranslateLoader),
          deps: [Http]
        }),
    IonicModule.forRoot(MyApp)
  ],
  exports: [BrowserModule, HttpModule, TranslateModule],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    LoginPage,
    ControlPage,
    CheckPage,
    CheckLimpiezaPage,
    SupervisionPage,
    SyncPage,
    Config,
    Empresa
  ],
  providers: [
    SQLite,
    Network,
    Camera,
    SocialSharing,
    StatusBar,
    Initdb,
    Sync,
    Servidor
  ]
  
})
export class AppModule {}


