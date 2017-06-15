import { Component } from '@angular/core';
import { NavController, MenuController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate/ng2-translate';
import { Network } from '@ionic-native/network';
import { HomePage } from '../home/home';
import { Empresa } from '../empresa/empresa';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import { URLS } from '../../models/models';
import * as moment from 'moment';

/*
  Generated class for the Login page.

  ee http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
  providers: [SyncPage]
})
export class LoginPage {
  public nombre: string;//="demo";
  public password: string;//="demo";
  public miDistancia: any;
  public logged;
  public accesomenu: any;
  public local: Storage;
  public result;
  public introvista;
  public logoempresa;
  public empresa = 0;
  public loader:any;
  constructor(public navCtrl: NavController, menu: MenuController, public data: Initdb,public translate: TranslateService, public sync: SyncPage,public network:Network,public loadingCtrl: LoadingController) {
  //  translate.use('es');
   if (this.network.type != 'none') {
  if (parseInt(localStorage.getItem("synccontrol")) > 0) { this.sync.sync_data_control();}
  if (parseInt(localStorage.getItem("syncchecklist")) > 0) { this.sync.sync_data_checklist();}
   }
   this.onconect();
   if (this.checkLogin() == true){
     this.navCtrl.setRoot(HomePage);
   }
}

  ionViewDidLoad() {
    console.log('Hello Login Page');
    this.empresa = parseInt(localStorage.getItem("idempresa"));
  //  this.logoempresa = "https://tfc.proacciona.es/logos/"+localStorage.getItem("idempresa")+"/logo.jpg";
    this.logoempresa = URLS.SERVER +"logos/"+localStorage.getItem("idempresa")+"/logo.jpg";
    
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
        this.permanentLogin();

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

permanentLogin(){
  let fecha =new Date().toString();
        localStorage.setItem("loggedTime",fecha);
        localStorage.setItem("nombre",this.nombre);
        localStorage.setItem("password",this.password);
        localStorage.setItem("idusuario",this.data.logged.toString());
        localStorage.setItem("login",this.data.logged.toString());
        sessionStorage.setItem("nombre",this.nombre);
        sessionStorage.setItem("password",this.password);
        sessionStorage.setItem("idusuario",this.data.logged.toString());
}
checkLogin():boolean{
    let resultado:boolean;
  if (localStorage.getItem("loggedTime")){
  let ahora = moment(new Date());
  let fecha = moment(new Date(localStorage.getItem("loggedTime"))).add(24,"h");
  console.log(ahora,fecha);
  if (moment(fecha).isAfter(moment(ahora))){
    console.log('logged ok');
      resultado = true;
        this.data.logged = parseInt(localStorage.getItem("idusuario"));
        sessionStorage.setItem("nombre",localStorage.getItem("nombre"));
        sessionStorage.setItem("password",localStorage.getItem("password"));
        sessionStorage.setItem("idusuario",localStorage.getItem("idusuario"));
        sessionStorage.setItem("login",localStorage.getItem("login"));        

  }else{
    console.log('logged timeout');
    resultado = false;
  }
  }else{
    resultado = false;
  }

  return resultado;
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


  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
  //  this.presentLoading();
    this.data.sincronizate().then(
    (response)=>{
      console.log('######',response);
   //   this.loader.dismiss();
          setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  });

  }

  presentLoading() {
    this.loader = this.loadingCtrl.create({
      content: "Actualizando...",
     // duration: 3000
    });
    this.loader.present();
    //loader.dismiss();
  }
    closeLoading(){
   setTimeout(() => {
      console.log('Async operation has ended');
      this.loader.dismiss()
    }, 1000);
  }
}
