import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';

import {TranslateService} from 'ng2-translate';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import { Servidor } from '../../providers/servidor';
import { URLS, Incidencia } from '../../models/models';
import * as moment from 'moment';

//import {TranslatePipe} from 'ng2-translate';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import { Network } from '@ionic-native/network';
import { HomePage } from '../home/home';


/**
 * Generated class for the IncidenciasPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 *  public servidor: Servidor, 
 * 
 *  
 */
@IonicPage()
@Component({
  selector: 'page-incidencias',
  templateUrl: 'incidencias.html',
  providers: [SyncPage]
})
export class IncidenciasPage {
  public base64Image: string;
  public origen;
  public idOrigen;
  public incidencia: Incidencia;
public hoy: Date = new Date();
  
  constructor(public navCtrl: NavController, public navParams: NavParams, public camera: Camera,
    public db :SQLite,public network:Network, private translate: TranslateService, public initdb: Initdb,
  public sync: SyncPage, public events: Events, public servidor: Servidor) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad IncidenciasPage',this.navParams);
    if (this.navParams.get("origen")){
    this.origen = this.navParams.get("origen");
    this.idOrigen = this.navParams.get("idOrigen");
    this.base64Image= this.navParams.get("foto");
    this.incidencia = new Incidencia(null,this.navParams.data.fecha,this.navParams.data.incidencia,this.navParams.data.solucion,
      this.navParams.data.responsable,this.navParams.data.idempresa,this.navParams.data.origen,this.navParams.data.idOrigen,
      this.navParams.data.origenasociado,this.navParams.data.idOrigenasociado,this.navParams.data.foto,
      this.navParams.data.descripcion,this.navParams.data.estado)
    console.log(this.incidencia)
    }else{
      this.incidencia = new Incidencia(null,null,'',null,parseInt(sessionStorage.getItem("iduser")),
      parseInt(localStorage.getItem("idempresa")),'Incidencias',0 ,'Incidencias',0,this.base64Image,null,-1)
    }
    this.db.create({name: 'data.db',location: 'default'})
    .then((db2: SQLiteObject) => {
    db2.executeSql("DELETE from incidencias", []).then((data) => {
      console.log("deleted x items incidencia");
    },
  (error)=>{console.log('Deleting incidencias ERROR',error)});
  }
);
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
  }
  isTokenExired (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    //return JSON.parse(window.atob(base64));
    let jwt = JSON.parse(window.atob(base64));
    console.log (moment.unix(jwt.exp).isBefore(moment()));
   return moment.unix(jwt.exp).isBefore(moment());
}


  creaIncidencia(){
     let fecha = moment(this.hoy).format('YYYY-MM-DD HH:mm');
     let mensaje;
     //this.translate.get("alertas."+incidencia).subscribe(resultado => { mensaje = resultado});
    this.db.create({name: 'data.db',location: 'default'})
    .then((db2: SQLiteObject) => { db2.executeSql('INSERT INTO incidencias (fecha, incidencia, solucion, responsable, idempresa, origen, idOrigen, origenasociado, idOrigenasociado, foto, descripcion, estado,idElemento) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [fecha, this.incidencia.incidencia,this.incidencia.solucion,parseInt(sessionStorage.getItem("idusuario")),parseInt(localStorage.getItem("idempresa")),this.incidencia.origen,this.incidencia.idOrigen,this.incidencia.origenasociado,this.incidencia.idOrigenasociado,this.incidencia.foto,this.incidencia.descripcion,-1,-1]).then(
  (Resultado) => { console.debug("insert_incidencia_ok:",Resultado);
  let incidencia = {'idLocal':Resultado.insertId}
  this.events.publish('nuevaIncidencia', incidencia);
  console.log('can go back',this.navCtrl.canGoBack());
  
  if (this.network.type != 'none' && this.incidencia.origen == 'Incidencias') {
    console.debug("conected");
  this.sync.sync_incidencias(-1,0,'Incidencias');
  console.debug("sync called?");
  //this.navCtrl.pop();
  this.closeIncidenciaPage();
  }
  else
  {
  console.debug ("suma:" + localStorage.getItem("syncincidencia"));
    localStorage.setItem("syncincidencia",(parseInt(localStorage.getItem("syncincidencia"))+1).toString());
    console.debug("this.myapp.badge",this.initdb.badge);
    this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
    //this.navCtrl.pop();
    this.closeIncidenciaPage();
  }
  },
  (error) => {
  console.debug(JSON.stringify(error))
  });
  });
  }
  closeIncidenciaPage(){
    if (this.navCtrl.canGoBack()){
      this.navCtrl.pop();
    }else{
      this.navCtrl.setRoot(HomePage);      
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
          this.incidencia.foto = this.base64Image;
      }, (err) => {
          console.debug(err);
      });
    }
}
