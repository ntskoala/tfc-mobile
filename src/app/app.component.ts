import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, AlertController,ModalController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { StatusBar } from '@ionic-native/status-bar';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { HomePage } from '../pages/home/home';
import { Initdb } from '../providers/initdb';
import { LoginPage } from '../pages/login/login';
import { Config } from '../pages/config/config';
import { SyncPage } from '../pages/sync/sync';
import { Empresa } from '../pages/empresa/empresa';
import { Servidor } from '../providers/servidor';
import { URLS } from '../models/models'

@Component({
templateUrl: 'app.component.html',
//  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage = HomePage;
  //rootPage = "TraspasosPage";
pages: Array<{title: string, component: any}>;



  constructor(platform: Platform, public initdb: Initdb,private servidor: Servidor, public translate: TranslateService, public modalCtrl: ModalController, public statusBar:StatusBar,public network:Network) {
//constructor(platform: Platform, public initdb: Initdb, public translate: TranslateService, public modalCtrl: ModalController, public statusBar:StatusBar) {
 console.log("before platform ready, check init");
    platform.ready().then(() => {
      console.log("platform ready, check init");
        if (localStorage.getItem("inicializado") === null){
          console.log("iniciar");
          if (this.network.type != 'none') {
            console.log("hay red,--> inicializa()");
          this.initdb.inicializa();
          }else{
            alert ('No hay conexión, para sincronizar los datos');
          }
      } else{
            this.hayUpdates().then(
            (versionActual)=>{
              if (versionActual == -1){
                console.log('ha habido un error');
              }else{
          console.log("versionActual Usuarios",versionActual);
          if (versionActual > parseInt(localStorage.getItem("versionusers"))) this.initdb.sincronizate(versionActual.toString());
              }
          });
    }

      if (localStorage.getItem("lang") === null){
        localStorage.setItem("lang",'es');
      }
      if (localStorage.getItem("lang") === undefined){
        translate.setDefaultLang('es');
        translate.use('es');
      }
      else {
          this.translate.use(localStorage.getItem("lang"));
          this.translate.setDefaultLang(localStorage.getItem("lang"));
      }
      console.log(localStorage.getItem("idempresa"));
    if (localStorage.getItem("idempresa") === null || localStorage.getItem("idempresa") == 'undefined'){
      console.log('dentro')
      let opciones =  {showBackdrop: true,enableBackdropDismiss:true}
      let modalEmpresa = this.modalCtrl.create(Empresa,opciones)

      modalEmpresa.onDidDismiss((data) => {
      if (localStorage.getItem("idempresa") == "26" && !this.existe()){
        this.pages.push({title:'menu.traspaso',component:"TraspasosPage"})
      }

   });
      modalEmpresa.present();
  //  this.nav.push(Empresa,null,null,()=>this.existe())
    }
 

       this.pages = [
         { title: 'menu.home' , component: HomePage },
      { title: 'menu.home' , component: HomePage },
      { title: 'menu.sync' , component: SyncPage },
      { title: 'menu.login' , component: LoginPage },
      { title: 'menu.config' , component: Config },
      ];
      if (localStorage.getItem("idempresa") == "26"){//Entorno produccion
      //  if (localStorage.getItem("idempresa") == "77"){//Entorno Desarrollo
        this.pages.push({title:'menu.traspaso',component:"TraspasosPage"})
      }
      

      statusBar.styleDefault();
    });
  }
hayUpdates() {
    let updates:number = -1;
    let parametros = '&idempresa=' + localStorage.getItem("idempresa")+"&entidad=empresas";
    return new Promise(resolve => {
        this.servidor.getObjects(URLS.VERSION_USERS, parametros).subscribe(
          response => {
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                updates = element.updateusers;
              }
            }
        },
        (error)=>{
          console.log(error)
          resolve(updates);
      },
        ()=>{
            resolve(updates);
        });
    });
        //return updates;
    }

openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    console.log(page.component);
    this.nav.setRoot(page.component);
}  
existe(){
  let resultado;
let indice = this.pages.findIndex((page)=>page.component=="TraspasosPage");
(indice < 0)? resultado = false: resultado = true;
return resultado;
}
sincrosired(){
// let connectSubscription = Network.onConnect().subscribe(() => {
//   alert (Network.connection);
//     //   if (Network.connection != 'none') {
//     //   if (parseInt(localStorage.getItem("synccontrol")) > 0) { this.sync.sync_data_control();}
//     //   if (parseInt(localStorage.getItem("syncchecklist")) > 0) { this.sync.sync_data_checklist();}
//     // }
// });
}





}
