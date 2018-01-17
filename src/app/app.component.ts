import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, AlertController,ModalController, LoadingController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { StatusBar } from '@ionic-native/status-bar';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { HomePage } from '../pages/home/home';
import { Initdb } from '../providers/initdb';
import { LoginPage } from '../pages/login/login';
import { SupervisionPage } from '../pages/supervision/supervision';
import { Config } from '../pages/config/config';
import { SyncPage } from '../pages/sync/sync';
import { Empresa } from '../pages/empresa/empresa';
import { Servidor } from '../providers/servidor';
import { URLS } from '../models/models'

@Component({
templateUrl: 'app.component.html',
providers: [SyncPage]
//styleUrls: ['./app.scss']
//  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage = HomePage;
  //rootPage = "TraspasosPage";
pages: Array<{title: string, component: any}>;

public loader: any;

  constructor(platform: Platform, public initdb: Initdb,private servidor: Servidor, public translate: TranslateService, public modalCtrl: ModalController, public statusBar:StatusBar,public network:Network,public loadingCtrl: LoadingController) {

//constructor(platform: Platform, public initdb: Initdb, public translate: TranslateService, public modalCtrl: ModalController, public statusBar:StatusBar) {
 console.debug("before platform ready, check init");
    platform.ready().then(() => {
     // if (this.network.type == 'none') {

     // }
      console.log("platform ready, check init");
      //localStorage.setItem("inicializado","1");
if (localStorage.getItem("versionusers") === null) {localStorage.setItem("versionusers","0")}
if (localStorage.getItem("synccontrol") === null) {localStorage.setItem("synccontrol","0")}
if (localStorage.getItem("syncchecklist") === null) {localStorage.setItem("syncchecklist","0")}
if (localStorage.getItem("syncchecklimpieza") === null) {localStorage.setItem("syncchecklimpieza","0")}
if (localStorage.getItem("syncsupervision") === null) {localStorage.setItem("syncsupervision","0")}

        if (isNaN(parseInt(localStorage.getItem("inicializado")))) localStorage.setItem("inicializado","1");
        console.log("#####iniciar#####",parseInt(localStorage.getItem("inicializado")) < this.initdb.versionDBLocal);        
          if (parseInt(localStorage.getItem("inicializado")) < this.initdb.versionDBLocal){
          console.log("iniciar",this.initdb.versionDBLocal);
          if (this.network.type != 'none') {
            console.log("hay red,--> inicializa()");
          this.initdb.inicializa();
          }else{
            alert ('No hay conexión, para sincronizar los datos');
          }
      } else{
          this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"));
            this.hayUpdates().then(
            (versionActual)=>{
              if (versionActual == -1){
                console.log('ha habido un error # app.48');
              }else{
          console.debug("versionActual Usuarios",versionActual);
          if (versionActual > parseInt(localStorage.getItem("versionusers"))) {
            this.presentLoading();
            this.initdb.sincronizate(versionActual.toString()).then(
              ()=>{
                this.closeLoading();
              }
            );
          }
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
      console.debug(localStorage.getItem("idempresa"));
    if (localStorage.getItem("idempresa") === null || localStorage.getItem("idempresa") == 'undefined'){
      console.debug('dentro')
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
        // { title: 'menu.home' , component: HomePage },
      { title: 'menu.home' , component: HomePage },
      {title: 'menu.supervision', component: SupervisionPage },
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
          console.debug(error)
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
    if (page.title == 'menu.login'){
        localStorage.removeItem("loggedTime");
        localStorage.removeItem("nombre");
        localStorage.removeItem("password");
        localStorage.removeItem("idusuario");
        localStorage.removeItem("login");
        sessionStorage.removeItem("nombre");
        sessionStorage.removeItem("password");
        sessionStorage.removeItem("idusuario");
    }
    console.debug(page.component);
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


  presentLoading() {
    console.debug('##SHOW LOADING 1');
    this.loader = this.loadingCtrl.create({
      content: "Actualizando...",
     // duration: 3000
    });
    this.loader.present();
    //loader.dismiss();
  }
    closeLoading(){
      console.debug('##HIDE LOADING 1');
   setTimeout(() => {
      console.debug('Async operation has ended');
      this.loader.dismiss()
    }, 600);
  }


}
