import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import {TranslateService} from 'ng2-translate';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import { Servidor } from '../../providers/servidor';
import { URLS, Incidencia } from '../../models/models';
import * as moment from 'moment';

//import {TranslatePipe} from 'ng2-translate';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import { SocialSharing } from '@ionic-native/social-sharing';
//import { EmailComposer } from 'ionic-native';
import { Network } from '@ionic-native/network';
import { MyApp } from '../../app/app.component';
import { PeriodosProvider } from '../../providers/periodos/periodos';
import { IncidenciasPage } from '../incidencias/incidencias';
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
public valorObjetivo: number;
public control: any;
public desactivado: boolean;
public fecha_prevista: Date;
public periodicidad: any;
public hayRetraso: number;
public autocompletar:boolean=false;
public hoy: Date = new Date();
//public teclado: string;
public hayIncidencia: number = 0;
public hayIncidenciaAd: number =0;
public valorText:string="";
public teclado:boolean=true;
public inputActive:boolean=false;
//public myapp: MyApp;
  constructor(public navCtrl: NavController, private navParams: NavParams, private translate: TranslateService, 
    public initdb: Initdb, public sync: SyncPage, public servidor: Servidor, public db :SQLite, public camera: Camera,
    public network:Network, public socialsharing: SocialSharing, public periodos: PeriodosProvider, public events: Events) {
    this.control = this.navParams.get('control');
    this.nombre = this.navParams.get('control').nombre;
    this.pla = this.navParams.get('control').pla;
    this.idcontrol = this.navParams.get('control').id;
    this.fecha_prevista = this.navParams.get('control').fecha;
    this.valorObjetivo = this.navParams.get('control').objetivo;
    try{
    this.periodicidad = JSON.parse(this.navParams.get('control').periodicidad);
    }catch(e){
      this.periodicidad = {repeticion:'por uso'}
    }
    //this.base64Image = "false";
    this.desactivado = false;
   // this.storage = new Storage(SqlStorage, {name: 'tfc'});
  //  translate.use('es');
  if (this.valorObjetivo) this.valor = this.valorObjetivo
  }

  ionViewDidLoad() {
    console.debug('Hello Control Page');
    this.sync.login();
    // if(localStorage.getItem("teclado") == "text"){
    //   this.teclado = "text";
    // }
  }

  ionViewDidEnter() {
    if (this.isTokenExired(localStorage.getItem('token')) && this.network.type != 'none'){
      let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
      this.servidor.login(URLS.LOGIN, param).subscribe(
        response => {
          if (response.success == 'true') {
            // Guarda token en sessionStorage
            localStorage.setItem('token', response.token);
            }
            });
    }
    if (this.periodicidad.repeticion!='por uso'){
    this.hayRetraso = this.periodos.hayRetraso(this.fecha_prevista,this.periodicidad);
    }
  }
isTokenExired (token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            //return JSON.parse(window.atob(base64));
            let jwt = JSON.parse(window.atob(base64));
            console.log (moment.unix(jwt.exp).isBefore(moment()));
           return moment.unix(jwt.exp).isBefore(moment());
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
    if (fuerarango != "false") {
      //this.sendalert(fuerarango);
      this.creaIncidencia(fuerarango);
    }
 }

creaIncidencia(incidencia){
 
let control,valorc, minimo,maximo, tolerancia,critico : string;
this.translate.get("control").subscribe(resultado => { control = resultado});
this.translate.get("valorc").subscribe(resultado => { valorc = resultado});
this.translate.get("minimo").subscribe(resultado => { minimo = resultado});
this.translate.get("maximo").subscribe(resultado => { maximo = resultado});
this.translate.get("tolerancia").subscribe(resultado => { tolerancia = resultado});
this.translate.get("critico").subscribe(resultado => { critico = resultado});

let bcontrol =  "control: "+this.control.nombre;
let bvalorc = valorc + this.valor;
let bminimo = minimo+ (this.control.minimo ==null ? "":this.control.minimo);
let bmaximo = maximo+ (this.control.maximo ==null ? "":this.control.maximo);
let btolerancia = tolerancia+ (this.control.tolerancia ==null ? "":this.control.tolerancia);
let bcritico = critico+ (this.control.critico ==null ? "":this.control.critico);
//let cabecera= '<br><img src="assets/img/logo.jpg" /><hr>';
let inci =  this.control.nombre + ' con valor: ' + this.valor ;
let descripcion = bcontrol+'&#10;&#13;'+ bvalorc+'&#10;&#13;'+ bminimo+'&#10;&#13;'+ bmaximo+'&#10;&#13;' +btolerancia+'&#10;&#13;'+bcritico+'&#10;&#13;';
  let idcontrol = this.idcontrol;
  let fecha = moment(this.hoy).format('YYYY-MM-DD HH:mm');
  let mensaje;
  this.translate.get("alertas."+incidencia).subscribe(resultado => { mensaje = resultado});
  this.db.create({name: 'data.db',location: 'default'})
  .then((db2: SQLiteObject) => { db2.executeSql('INSERT INTO incidencias (fecha, incidencia, solucion, responsable, idempresa, origen, idOrigen, origenasociado, idOrigenasociado, foto, descripcion, estado, idElemento) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
  [fecha, inci,'',parseInt(sessionStorage.getItem("idusuario")),parseInt(localStorage.getItem("idempresa")),'Controles',idcontrol,'Controles',0,this.base64Image,mensaje,-1,]).then(
(Resultado) => { console.log("insert_incidencia_ok:",Resultado);
this.hayIncidencia= Resultado.insertId;
// if (this.network.type != 'none') {
//   console.debug("conected");
//   this.sync.sync_incidencias();
// }
// else
// {
// console.debug ("suma:" + localStorage.getItem("syncincidencia"));
//   localStorage.setItem("syncincidencia",(parseInt(localStorage.getItem("syncincidencia"))+1).toString());
//   console.debug("this.myapp.badge",this.initdb.badge);
//   this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
// }
},
(error) => {
console.log('ERROR INSERTANDO INCIDENCIA',JSON.stringify(error))
});
});
}

terminar(){
  this.valor = parseFloat(this.valorText);
  let idcontrol = this.idcontrol;
 if (!isNaN(this.valor))
 {
   let fecha;
   this.desactivado = true;
   (this.autocompletar)? fecha = moment(this.fecha_prevista).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:mm'): fecha= moment(this.hoy).format('YYYY-MM-DD HH:mm');
   console.log(fecha);
   this.checkrangoerror(idcontrol);
                  //let db= new SQLite();
                  this.db.create({name: 'data.db',location: 'default'})
                  .then((db2: SQLiteObject) => { db2.executeSql('INSERT INTO resultadoscontrol (idcontrol, resultado, fecha, foto, idusuario) VALUES (?,?,?,?,?)',
                  [idcontrol,this.valor, fecha, this.base64Image,sessionStorage.getItem("idusuario")]).then(
  (Resultado) => { console.log("insert_ok:",Resultado);
                    if (this.hayIncidencia > 0){
                      db2.executeSql('UPDATE incidencias set idElemento = ? WHERE id = ?',[Resultado.insertId,this.hayIncidencia]).then(
                        (Resultado) => { console.log("update_Incidencia_ok:",Resultado);}
                        ,
                        (error) => {
                        console.log('ERROR UPDATE INCIDENCIA',JSON.stringify(error))
                        });
                    }
                    if (this.hayIncidenciaAd > 0){
                      db2.executeSql('UPDATE incidencias set idElemento = ? WHERE id = ?',[Resultado.insertId,this.hayIncidenciaAd]).then(
                        (Resultado) => { console.log("update_Incidencia_ok:",Resultado);}
                        ,
                        (error) => {
                        console.log('ERROR UPDATE INCIDENCIA',JSON.stringify(error))
                        });
                    }                    
  //******UPDATE FECHA LOCAL*/
  //******UPDATE FECHA LOCAL*/
  
  this.updateFecha(this.fecha_prevista,this.autocompletar);
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

updateFecha(fecha,completaFechas){
  console.log("update fecha",fecha, completaFechas);
  let proxima_fecha;
  if (moment(fecha).isValid() && this.periodicidad.repeticion != "por uso") {
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,fecha,completaFechas)).format('YYYY-MM-DD');
  } else {
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,this.hoy)).format('YYYY-MM-DD');
  }
  
  console.log("updating fecha",proxima_fecha);
  if (moment(proxima_fecha).isAfter(moment(),'day') || this.periodicidad.repeticion == "por uso"){
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql('UPDATE controles set  fecha = ? WHERE id = ?',[proxima_fecha, this.idcontrol]).then
      ((Resultado) => {
           console.log("updated fecha: ", Resultado);
      },
      (error) => {
        console.debug('ERROR ACTUALIZANDO FECHA', error);
       }); 
    });        
    if (this.network.type != 'none') {
      console.debug("conected");
      this.sync.sync_data_control();
  }
  else
  {
    console.debug ("suma:" + localStorage.getItem("synccontrol"));
      localStorage.setItem("synccontrol",(parseInt(localStorage.getItem("synccontrol"))+1).toString());
      console.debug("this.myapp.badge",this.initdb.badge);
      this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
  }
this.navCtrl.pop();
        }else{

          console.log("sigue programando: ",proxima_fecha,this.periodicidad.repeticion);
          this.fecha_prevista = proxima_fecha;
          this.terminar();
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
  console.log(alerta);
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
let empresa = '<br><h4>Empresa: ' + localStorage.getItem('empresa') + '</h4><br>'

let body;

if (this.network.type != 'none') {
  body = mensaje + '<br>' + parametros + pie;
  console.log("conected");
  let param = '&idempresa=' + localStorage.getItem("idempresa") + '&body=' +body;
  this.servidor.getObjects(URLS.SENDALERT, param).subscribe(
    response => {
      console.log('respuesta send alert: ', response);
      if (response.success == 'true') {
        // Guarda token en sessionStorage
        //localStorage.setItem('token', response.token);

        }
        });
}
else
{
  body = mensaje + '<br>' + parametros + pie +empresa;
console.log("preparando email:" + alerta);
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

nuevaIncidencia(){
  let incidencia = 'Incidencia en ' + this.nombre
  let params= new Incidencia(null,null,incidencia,'',parseInt(sessionStorage.getItem("iduser")),
  parseInt(localStorage.getItem("idempresa")),'Controles',this.control.id ,'Controles',0,this.base64Image,'',-1)
  this.navCtrl.push(IncidenciasPage,params);
  this.events.subscribe('nuevaIncidencia', (param) => {
    // userEventData is an array of parameters, so grab our first and only arg
    console.log('Id Incidencia Local', param);
    this.hayIncidenciaAd = param.idLocal;
  });
}

setValue(valorText:number | string){
  if (typeof(valorText)=='string'){
    switch(valorText){
      case "del":
      this.valorText =  this.valorText.substr(0,this.valorText.length-1);
      break;
      case ".":
      this.valorText+=valorText;
      break;
      case "-":
      this.valorText.substr(0,1) == '-'? this.valorText = this.valorText.substr(1,this.valorText.length-1):this.valorText = "-" + this.valorText;
      break;
    }
  }else{
    this.valorText+=valorText.toString();
  }
}
}
