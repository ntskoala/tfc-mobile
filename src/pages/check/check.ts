import { Component } from '@angular/core';
import { NavController, NavParams, AlertController,ActionSheetController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import * as moment from 'moment';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import { Servidor } from '../../providers/servidor';
import { PeriodosProvider } from '../../providers/periodos/periodos';
import { URLS } from '../../models/models';

import { Network } from '@ionic-native/network';
import { MyApp } from '../../app/app.component';


export class Checks {
  id: number;
  idchecklist: number;
  nombrechecklist: string;
  idcontrol:number;
  nombrecontrol:string;
  checked:string;
  valor:string;
  descripcion: string;
  foto: string;
}
/*
  Generated class for the Check page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-check',
  templateUrl: 'check.html',
  providers: [SyncPage]
})
export class CheckPage {
public checklistcontroles: Checks[] = [];
public resultadoschecklistcontroles: any;
public checks: any;
//private storage: Storage;
public idchecklist;
public nombrechecklist: string;
public base64Image;
public checkvalue:string;
public selectedValue:string;
public fecha_prevista: Date;
public periodicidad: any;
public hayRetraso: number;
public autocompletar:boolean=false;
public hoy: Date = new Date();
//public myapp: MyApp;
//public db: SQLite;
//public fotositems: string[] =[];
  constructor(public navCtrl: NavController, private params: NavParams, private alertCtrl: AlertController, 
    public actionSheetCtrl: ActionSheetController, public initdb: Initdb, public sync: SyncPage, 
    private translate: TranslateService,public db :SQLite, public camera: Camera,public servidor: Servidor,
    public network:Network, public periodos: PeriodosProvider) {
    
        this.idchecklist =  this.params.get('checklist').idchecklist;
        this.nombrechecklist = this.params.get('checklist').nombrechecklist;
        this.fecha_prevista = this.params.get('checklist').fecha;
        this.periodicidad = JSON.parse(this.params.get('checklist').periodicidad);
        //this.db = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then(() => {
            //this.refresh();
            this.getChecklists(this.idchecklist);
            console.debug("base de datos abierta");
        }, (error) => {
            console.debug("ERROR al abrir la bd: ", error);
        });
  }

  ionViewDidLoad() {
    console.debug('Hello Check Page');
    //this.sync.login();
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
    this.hayRetraso = this.periodos.hayRetraso(this.fecha_prevista,this.periodicidad);
  }
isTokenExired (token) {
  if (token){
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace('-', '+').replace('_', '/');
            //return JSON.parse(window.atob(base64));
            let jwt = JSON.parse(window.atob(base64));
            console.log (moment.unix(jwt.exp).isBefore(moment()));
           return moment.unix(jwt.exp).isBefore(moment());
  }else{
    return true;
  }
}


getChecklists(idchecklist){
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("Select * FROM checklist WHERE idchecklist = ? and idusuario = ?",[idchecklist, sessionStorage.getItem("idusuario")]).then((data) => {
                  console.debug ("resultado1" + data.rows.length);
                  
                  
                  for (var index=0;index < data.rows.length;index++){
                     // this.checklistcontroles.push(data.rows[index]);
                      this.checklistcontroles.push({
                            "id": data.rows.item(index).id,
                            "idchecklist": data.rows.item(index).idchecklist,
                            "nombrechecklist": data.rows.item(index).nombrechecklist,
                            "idcontrol":data.rows.item(index).idcontrol,
                            "nombrecontrol":data.rows.item(index).nombrecontrol,
                            "checked":'',
                            "valor":'',
                            "descripcion":data.rows.item(index).descripcion,
                            "foto": ""
                      });
                 
                      
                      
                      //alert (data.res.rows[index].nombrechecklist);
                    }
                  //this.checklistcontroles = data.res.rows;
                  //this.checklistcontroles = JSON.parse(data.res.rows);
                  //console.debug (this.checklistcontroles);
              }, (error) => {
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error " + JSON.stringify(error.err));
              }); 
                  });
}


terminar(){
  console.debug(this.checklistcontroles);
  let fecha;
  
  (this.autocompletar)? fecha = moment(this.fecha_prevista).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:MM'): fecha= moment(this.hoy).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:MM');
  
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql('INSERT INTO resultadoschecklist (idchecklist,fecha, foto,idusuario) VALUES (?,?,?,?)',
      [this.idchecklist, fecha, this.base64Image,sessionStorage.getItem("idusuario")]).then(
  (Resultado) => { 
          // console.debug("resultado: " + Resultado.res.insertId);
           console.debug("resultado2: " + Resultado.insertId);
          let idresultadochecklist = Resultado.insertId;
          //localStorage.setItem("sync",(parseInt(localStorage.getItem("sync"))+1).toString());
          for(var index in this.checklistcontroles) { 
            var attr = this.checklistcontroles[index];
            db2.executeSql('INSERT INTO resultadoscontroleschecklist (idcontrolchecklist,idchecklist, resultado, descripcion, fotocontrol, idresultadochecklist) VALUES (?,?,?,?,?,?)',[attr.idcontrol,this.idchecklist,attr.checked,attr.descripcion,attr.foto,idresultadochecklist]).then(
          (Resultado) => { console.debug(Resultado);},
          (error) => {console.log('ERROR al INSERT RESULTADOSCHECKLIST DDBB',error)});
        }

  //******CALCULAR FECHA */
  //******CALCULAR FECHA */

  // let proxima_fecha;
  // if (this.periodicidad['repeticion'] =="por uso"){
  //   proxima_fecha = moment(new Date()).format('YYYY-MM-DD');
  // }else{
  //   proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,this.fecha_prevista)).format('YYYY-MM-DD');
  // }
  // console.log('PROXIMA_FECHA:',this.periodicidad.repeticion, proxima_fecha);

  //******UPDATE FECHA LOCAL*/
  //******UPDATE FECHA LOCAL*/
  this.updateFecha(this.fecha_prevista,this.autocompletar);

},
  (error) => {console.log('ERROR al abrir DDBB',error)});
  });


}

updateFecha(fecha,completaFechas){
  let proxima_fecha;
  if (moment(fecha).isValid() && this.periodicidad.repeticion != "por uso") {
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,fecha,completaFechas)).format('YYYY-MM-DD');
  } else {
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,this.hoy)).format('YYYY-MM-DD');
  }
  
  console.log("updating fecha",proxima_fecha);
  if (moment(proxima_fecha).isAfter(moment(),'day')){
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
  //******UPDATE FECHA LOCAL*/
  //******UPDATE FECHA LOCAL*/
  db2.executeSql('UPDATE checklist set  fecha = ? WHERE idchecklist = ?',[proxima_fecha, this.idchecklist]).then
  ((Resultado) => {
       console.log("updated fecha: ", Resultado);
  },
  (error) => {
    console.debug('ERROR ACTUALIZANDO FECHA', error);
   });
    });        
    if (this.network.type != 'none') {
      console.debug("conected");
      this.sync.sync_data_checklist();
    }
    else {
      localStorage.setItem("syncchecklist", (parseInt(localStorage.getItem("syncchecklist")) + 1).toString());
      this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"));
    }
    this.navCtrl.pop();
        }else{

          console.log("sigue programando: ",proxima_fecha);
          this.fecha_prevista = proxima_fecha;
          this.terminar();
        }
}


takeFoto(control ?){
  //this.base64Image = "data:image/jpeg;base64,";
  this.camera.getPicture({
        destinationType: this.camera.DestinationType.DATA_URL,
        quality: 50,
        targetWidth: 300,
        targetHeight: 300,
        correctOrientation: true
    }).then((imageData) => {
      // imageData is a base64 encoded string
      if (control){
        control.foto = "data:image/jpeg;base64," + imageData;
      }else{
        this.base64Image = "data:image/jpeg;base64," + imageData;
      }
        
    }, (err) => {
        console.debug(err);
    });
    console.debug(this.checklistcontroles);
  }
editar(control){
          let prompt = this.alertCtrl.create({
            title: 'Descripcion',
            inputs: [{name: 'descripcion'}],
            buttons: [
                {text: 'Cancel'},
                {text: 'Add',handler: data => {control.descripcion = data.descripcion;}
                }]
            });
        prompt.present();
}
setValor(control){
          let prompt = this.alertCtrl.create({
            title: 'Valor',
            inputs: [{name: 'valor'}],
            buttons: [
                {text: 'Cancel'},
                {text: 'Ok',handler: data => {control.checked = data.valor;control.valor = data.valor;}
                }]
            });
        prompt.present();
}
  opciones(control) {
    let correcto;
    let incorrecto;
    let aplica;
    let valor;
    let descrip;
    let cancel;
    this.translate.get("correcto").subscribe(resultado => {correcto = resultado;});
    this.translate.get("incorrecto").subscribe(resultado => { incorrecto = resultado;});
    this.translate.get("no aplica").subscribe(resultado => { aplica = resultado;});
    this.translate.get("valor").subscribe(resultado => { valor = resultado;});
    this.translate.get("descripcion").subscribe(resultado => { descrip = resultado;});
    this.translate.get("cancel").subscribe(resultado => { cancel = resultado;});
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Opciones',
      buttons: [
        {text: correcto,icon:'checkmark-circle',handler: () => {control.checked='true';control.valor = '';}},
        {text: incorrecto,icon:'close-circle',handler: () => {control.checked='false';control.valor = '';}},
        {text: aplica,icon:'help-circle',handler: () => {control.checked='na';control.valor = '';}},
        {text: valor,icon:'information-circle',handler: () => {this.setValor(control);}},
        {text: descrip,icon:'clipboard',handler: () => {this.editar(control);}},
        {text: 'Foto',icon:'camera',handler: () => {this.takeFoto(control);}},
        {text: cancel,role: 'cancel',handler: () => {console.debug('Cancel clicked');}}
        ]
         });
    actionSheet.present();
  }

changeSelected(){
  this.selectedValue = this.checkvalue;
}

changeValor(control){
  if (control.valor === null || control.valor === null || control.valor === undefined || isNaN(control.valor)){
    this.translate.get("alertas.errorvalor")
  .subscribe(resultado => { alert(resultado);});
  }
}

}
