import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {TranslateService} from 'ng2-translate';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';

//import {TranslatePipe} from 'ng2-translate';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import { SocialSharing } from '@ionic-native/social-sharing';
//import { EmailComposer } from 'ionic-native';
import { Network } from '@ionic-native/network';
import { MyApp } from '../../app/app.component';
/*
  Generated class for the Control page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-control',
  templateUrl: 'control.html',
  providers: [SyncPage]
})
export class ControlPage {
public base64Image: string;
public nombre: string;
public pla: string;
public idcontrol: number;
public valor: number;
public control: any;
public desactivado: boolean;
//public myapp: MyApp;
  constructor(public navCtrl: NavController, private navParams: NavParams, private translate: TranslateService, public initdb: Initdb, public sync: SyncPage,public db :SQLite, public camera: Camera,public network:Network,public socialsharing: SocialSharing) {
    this.control = this.navParams.get('control');
    this.nombre = this.navParams.get('control').nombre;
    this.pla = this.navParams.get('control').pla;
    this.idcontrol = this.navParams.get('control').id;
    //this.base64Image = "false";
    this.desactivado = false;
   // this.storage = new Storage(SqlStorage, {name: 'tfc'});
  //  translate.use('es');
  }

  ionViewDidLoad() {
    console.debug('Hello Control Page');
  }
 checkrangoerror(idcontrol){
   let fuerarango = "false";
    if (!isNaN(this.control.minimo) && this.control.minimo != null){
      if (this.valor < this.control.minimo) {
       console.debug("valor minimo");
        fuerarango = "valorminimo";
      } 
   }
    if (!isNaN(this.control.maximo) && this.control.maximo != null){
      if (this.valor > this.control.maximo){
       console.debug("valor maximo");
        fuerarango = "valormaximo";
      } 
    }
    // if (!isNaN(this.control.tolerancia) && this.control.tolerancia != null){
    //   if (this.valor >= this.control.tolerancia){
    //    console.debug("valor tolerancia"); 
    //     fuerarango = "tolerancia";
    //   }  
    // }
    if (!isNaN(this.control.critico) && this.control.critico != null){
      if (this.valor > this.control.critico){
       console.debug("valor critico"); 
       fuerarango = "critico";
      }  
    }
    if (fuerarango != "false") this.sendalert(fuerarango);
 }
terminar(idcontrol){
 if (!isNaN(this.valor))
 {
   this.desactivado = true;
   this.checkrangoerror(idcontrol);
                  //let db= new SQLite();
                  this.db.create({name: 'data.db',location: 'default'})
                  .then((db2: SQLiteObject) => { db2.executeSql('INSERT INTO resultadoscontrol (idcontrol, resultado, foto, idusuario) VALUES (?,?,?,?)',[idcontrol,this.valor,this.base64Image,sessionStorage.getItem("idusuario")]).then(
  (Resultado) => { console.debug("insert_ok:",Resultado);
                   
                          if (this.network.type != 'none') {
                              console.debug("conected");
                              this.sync.sync_data_control();
                              
                          }
                          else
                          {
                            console.debug ("suma:" + localStorage.getItem("synccontrol"));
                              localStorage.setItem("synccontrol",(parseInt(localStorage.getItem("synccontrol"))+1).toString());
                              console.debug("this.myapp.badge",this.initdb.badge);
                              this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));
                          }

                  this.navCtrl.pop();
                  },
  (error) => {
    console.debug(JSON.stringify(error))
    });
 });
 }
 else // NO HAY UN NUMERO EN RESULTADO
 {
  this.translate.get("alertas.errorvalor")
  .subscribe(resultado => { alert(resultado);});
//alert(this.translate.instant("errorvalor")); 
} 
}


takeFoto(){
  this.base64Image = "data:image/jpeg;base64,";
  this.camera.getPicture({
        destinationType: this.camera.DestinationType.DATA_URL,
        quality: 50,
        targetWidth: 300,
        targetHeight: 300,
        correctOrientation: true
    }).then((imageData) => {
      // imageData is a base64 encoded string
        this.base64Image = "data:image/jpeg;base64," + imageData;
        
    }, (err) => {
        console.debug(err);
    });
  }

sendalert(alerta){
  let mensaje: string;
  let subject: string;
  let error: string;
  let pie: string;
  let control,valorc, minimo,maximo, tolerancia,critico : string;

  this.translate.get("alertas."+alerta).subscribe(resultado => { mensaje = resultado});
  alert (mensaje);
this.translate.get("email.subject").subscribe(resultado => { subject = resultado});
this.translate.get("email.body").subscribe(resultado => { error = resultado});
this.translate.get("email.pie").subscribe(resultado => { pie = resultado});
this.translate.get("control").subscribe(resultado => { control = resultado});
this.translate.get("valorc").subscribe(resultado => { valorc = resultado});
this.translate.get("minimo").subscribe(resultado => { minimo = resultado});
this.translate.get("maximo").subscribe(resultado => { maximo = resultado});
this.translate.get("tolerancia").subscribe(resultado => { tolerancia = resultado});
this.translate.get("critico").subscribe(resultado => { critico = resultado});
let bcontrol = control +": "+this.control.nombre;
let bvalorc = valorc + this.valor;
let bminimo = minimo+ (this.control.minimo ==null ? "":this.control.minimo);
let bmaximo = maximo+ (this.control.maximo ==null ? "":this.control.maximo);
let btolerancia = tolerancia+ (this.control.tolerancia ==null ? "":this.control.tolerancia);
let bcritico = critico+ (this.control.critico ==null ? "":this.control.critico);
//let cabecera= '<br><img src="assets/img/logo.jpg" /><hr>';
let parametros = bcontrol+'<br>'+ bvalorc+'<br>'+ bminimo+'<br>'+ bmaximo+'<br>' +btolerancia+'<br>'+bcritico+'<br>';

let body = mensaje + '<br>' + parametros + pie;


console.debug("preparando email:" + alerta);
this.socialsharing.canShareViaEmail().then(() => {
                        this.socialsharing.shareViaEmail(
                          body, 
                          subject,
                          [localStorage.getItem("email")],
                          [ "alertes@proacciona.es"],
                          null,
                          this.base64Image).then(() => {
                              console.debug("email ready");
                        }).catch(() => {
                              this.translate.get("alertas.nohayemail")
                              .subscribe(resultado => { alert(resultado);});
                        });
}).catch(() => {
  this.translate.get("alertas.nohayemail")
  .subscribe(resultado => { alert(resultado);});
});
}

// sendalert2(alerta){
// let mensaje 
// this.translate.get("alertas.rangoerror").subscribe(resultado => { mensaje = resultado});
//   alert (mensaje);

//   EmailComposer.isAvailable().then((available: boolean) =>{
//  if(available) {
  
//             let email = {
//               to: 'jorged@ntskoala.com',
//              // cc: 'erika@mustermann.de',
//              // bcc: ['john@doe.com', 'jane@doe.com'],
//               attachments: [
//                // 'file://img/logo.png',
//                // 'res://icon.png',
//                 'base64:'+this.base64Image
//                // 'file://README.pdf'
//               ],
//               subject: 'Proacciona -> parametro fuera de rango permitido',
//               body: 'How are you? Nice greetings from Leipzig',
//               isHtml: true
//             };

//             // Send a text message using default options
//             EmailComposer.open(email);


//  }
//  else { this.translate.get("alertas.nohayemail").subscribe(resultado => { alert(resultado)});}
// },
// (error) => { console.debug(error)}
// );


// }


}
