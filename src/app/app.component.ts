import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, AlertController,ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { HomePage } from '../pages/home/home';
import { Initdb } from '../providers/initdb';
import { LoginPage } from '../pages/login/login';
import { Config } from '../pages/config/config';
import { SyncPage } from '../pages/sync/sync';
import { Empresa } from '../pages/empresa/empresa';


@Component({
templateUrl: 'app.component.html',
//  template: `<ion-nav [root]="rootPage"></ion-nav>`
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage = HomePage;
  //rootPage = "TraspasosPage";
pages: Array<{title: string, component: any}>;



  constructor(platform: Platform, public initdb: Initdb, public translate: TranslateService, public modalCtrl: ModalController, public statusBar:StatusBar) {

    
    platform.ready().then(() => {
      this.initdb.inicializa();
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
     console.log("dismissed",data);
     console.log(data,localStorage.getItem("idempresa"),this.existe)
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
      if (localStorage.getItem("idempresa") == "26"){
        this.pages.push({title:'menu.traspaso',component:"TraspasosPage"})
      }
      

      statusBar.styleDefault();
    });
  }

ionViewDidEnter(){
  console.log("didenter");
  this.existe();
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
