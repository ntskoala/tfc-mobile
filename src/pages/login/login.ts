import { Component } from '@angular/core';
import { NavController, MenuController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { Network } from '@ionic-native/network';
import { HomePage } from '../home/home';
import { Empresa } from '../empresa/empresa';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb'
/*
  Generated class for the Login page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [SyncPage]
})
export class LoginPage {
  public nombre: string="vaqueria";
  public password: string="123";
  public miDistancia: any;
  public logged;
  public accesomenu: any;
  public local: Storage;
  public result;
  public introvista;
  public logoempresa;
  public empresa = 0;
  constructor(public navCtrl: NavController, menu: MenuController, public data: Initdb,public translate: TranslateService, public sync: SyncPage,public network:Network) {
  //  translate.use('es');
   if (this.network.type != 'none') {
  if (parseInt(localStorage.getItem("synccontrol")) > 0) { this.sync.sync_data_control();}
  if (parseInt(localStorage.getItem("syncchecklist")) > 0) { this.sync.sync_data_checklist();}
   }
   this.onconect();
}

  ionViewDidLoad() {
    console.log('Hello Login Page');
    this.empresa = parseInt(localStorage.getItem("idempresa"));
    this.logoempresa = "http://tfc.proacciona.es/logos/"+localStorage.getItem("idempresa")+"/logo.jpg";
  }



login(){
  if (this.nombre == "koala"){
    //sessionStorage.setItem("idusuario","koala");

    this.navCtrl.push(Empresa);
  }
  else{
  let mensaje: string;
  this.data.getLogin(this.nombre,this.password).then((data) => { 
      console.log("getlogin:" + data);
      if (!isNaN(this.data.logged)){
        sessionStorage.setItem("nombre",this.nombre);
        sessionStorage.setItem("password",this.password);
          sessionStorage.setItem("idusuario",this.data.logged.toString());
          this.navCtrl.setRoot(HomePage);
          }
        else{
            this.translate.get("alertas.maluser").subscribe(resultado => { mensaje = resultado});
            alert (mensaje);
        }
    },
    (error)=> {
            this.translate.get("alertas.maluser").subscribe(resultado => { mensaje = resultado});
            alert (mensaje);
      console.log ("error: " + error)}
    );
  }

  }

onconect(){
  let connectSubscription = this.network.onConnect().subscribe(() => {
  //alert (Network.type);
      if (this.network.type != 'none') {
      if (parseInt(localStorage.getItem("synccontrol")) > 0) { this.sync.sync_data_control();}
      if (parseInt(localStorage.getItem("syncchecklist")) > 0) { this.sync.sync_data_checklist();}
    }
});
}

}
