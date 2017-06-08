import { Component } from '@angular/core';
//import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { NavController, NavParams, AlertController,ActionSheetController } from 'ionic-angular';

//import { CheckLimpiezaPage } from './check-limpieza';


import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import {Servidor} from '../../providers/servidor';

import { Network } from '@ionic-native/network';
import { URLS, checkLimpieza,limpiezaRealizada } from '../../models/models'

import * as moment from 'moment'; 
/**
 * Generated class for the CheckLimpiezaPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
//@IonicPage()
@Component({
  selector: 'page-check-limpieza',
  templateUrl: 'check-limpieza.html',
  providers: [SyncPage]
})
export class CheckLimpiezaPage {

public nombreLimpieza: string;
public checkLimpiezas:checkLimpieza[]=[];
public idlimpiezazona:number;
public limpiezaRealizada: limpiezaRealizada;
public hoy: Date = new Date();
  constructor(public navCtrl: NavController, private params: NavParams, private alertCtrl: AlertController, public actionSheetCtrl: ActionSheetController, public network:Network,public db: SQLite, private translate: TranslateService,public camera: Camera, private sync: SyncPage, private initdb: Initdb, public servidor: Servidor) {
       console.log("param",this.params.get('limpieza'));
       
       this.idlimpiezazona =  this.params.get('limpieza').idlimpiezazona;
        this.nombreLimpieza = this.params.get('limpieza').nombrelimpieza;
     
      //this.limpieza.id =1;
      //this.limpieza.nombreLimpieza ="test";

  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad CheckLimpiezaPage');
    this.getLimpiezas();

if (this.network.type != 'none'){
      let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
    this.servidor.login(URLS.LOGIN, param).subscribe(
      response => {
        if (response.success == 'true') {
          // Guarda token en sessionStorage
          sessionStorage.setItem('token', response.token);
          }
          });
}
  }




getLimpiezas(){
  this.checkLimpiezas =[];
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  db2.executeSql("Select * FROM checklimpieza WHERE idlimpiezazona = ?", [this.idlimpiezazona]).then((data) => {
                  
                  console.log(data.rows.length);
                      for (var index=0;index < data.rows.length;index++){
                        let isondate = moment(data.rows.item(index).fecha).isSameOrBefore(this.hoy);
//id , idlimpiezazona ,idusuario , nombrelimpieza , idelemento , nombreelementol , fecha , tipo , periodicidad , productos , protocolo
                        this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idlimpiezazona,data.rows.item(index).nombrelimpieza,data.rows.item(index).idelemento,
                        data.rows.item(index).nombreelementol,data.rows.item(index).fecha,data.rows.item(index).tipo,data.rows.item(index).periodicidad,data.rows.item(index).productos,data.rows.item(index).protocolo,false,data.rows.item(index).idusuario,data.rows.item(index).responsable,'',isondate));
                        //this.checkLimpiezas.push(data.rows.item(index));
                    }
                  console.log ("checkLimpiezas:", this.checkLimpiezas);
              }, (error) => {
                  console.log("ERROR home. 342-> " + JSON.stringify(error.err));
                  alert("error home. 342" + JSON.stringify(error.err));
              }); 
                  });
}

terminar(){
  let idempresa = localStorage.getItem("idempresa");
  let idusuario = sessionStorage.getItem("idusuario")
  console.log("terminar",this.checkLimpiezas);
  this.checkLimpiezas.forEach((elemento)=>{
    console.log("terminar2",elemento);
if (elemento.checked){
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql('INSERT INTO resultadoslimpieza (idelemento, idempresa, fecha_prevista, nombre, descripcion, tipo, idusuario, responsable,  idlimpiezazona ) VALUES (?,?,?,?,?,?,?,?,?)',
        //[0,0,'2017-05-29','test','rtest','interno',0,'jorge',0]).then(
        [elemento.idElementoLimpieza,idempresa,elemento.fecha_prevista,elemento.nombreLimpieza + " " + elemento.nombreElementoLimpieza,elemento.descripcion,elemento.tipo,idusuario,elemento.responsable,elemento.idLimpieza]).then(
  (Resultado) => {
      let proxima_fecha = moment(this.nuevaFecha(elemento)).format('YYYY-MM-DD');
      console.log("updated fecha: ",proxima_fecha,elemento.fecha_prevista);
      //elemento.fecha_prevista = proxima_fecha;
      db2.executeSql('UPDATE checklimpieza set  fecha = ? WHERE id = ?',[proxima_fecha, elemento.id]).then
      ((Resultado) => {
           console.log("updated fecha: ", Resultado);
          //SI HAY RED UPDATE BACKOFFICE
           if (this.network.type != 'none') {
            console.log("updating serer");
             let param = "?entidad=limpieza_elemento&id="+elemento.idElementoLimpieza;
             let limpia={fecha:proxima_fecha};
            this.servidor.putObject(URLS.STD_ITEM,param,limpia).subscribe(
              (resultado)=>console.log(resultado),
              (error)=>console.log(error),
              ()=>console.log('fin updating fecha')
            );
          }
      },
      (error) => {
        console.log('ERROR ACTUALIZANDO FECHA', error);
       });
  });
},
  (error) => {console.log(JSON.stringify(error))});
}
});
  

            if (this.network.type != 'none') {
            console.log("conected");
            this.sync.sync_checklimpieza();
          }
          else {
            localStorage.setItem("syncchecklimpieza", (parseInt(localStorage.getItem("syncchecklimpieza")) + 1).toString());
            this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist")+parseInt(localStorage.getItem("syncchecklimpieza")));
          }


this.navCtrl.pop();
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
      //  {text: valor,icon:'information-circle',handler: () => {this.setValor(control);}},
      //  {text: descrip,icon:'clipboard',handler: () => {this.editar(control);}},
      //  {text: 'Foto',icon:'camera',handler: () => {this.takeFoto(control);}},
        {text: cancel,role: 'cancel',handler: () => {console.log('Cancel clicked');}}
        ]
         });
    actionSheet.present();
  }



  nuevaFecha(limpieza: checkLimpieza){
      let periodicidad = JSON.parse(limpieza.periodicidad)
      let hoy = new Date();
      let proximaFecha;
      
      switch (periodicidad.repeticion){
        case "diaria":
        proximaFecha = this.nextWeekDay(periodicidad);
        break;
        case "semanal":

        proximaFecha = moment(limpieza.fecha_prevista).add(periodicidad.frecuencia,"w");
        break;
        case "mensual":
        if (periodicidad.tipo == "diames"){
            proximaFecha = moment(limpieza.fecha_prevista).add(periodicidad.frecuencia,"M");
        } else{
          proximaFecha = this.nextMonthDay(limpieza,periodicidad);
        }

        break;
        case "anual":
        if (periodicidad.tipo == "diames"){
          let año = moment(limpieza.fecha_prevista).get('year') + periodicidad.frecuencia;
        proximaFecha = moment().set({"year":año,"month":parseInt(periodicidad.mes)-1,"date":periodicidad.numdia});
        } else{
          proximaFecha = this.nextYearDay(limpieza,periodicidad);
        }
        break;
      }
      let newdate;
      newdate = moment(proximaFecha).toDate();
      return newdate = new Date(Date.UTC(newdate.getFullYear(), newdate.getMonth(), newdate.getDate()))
}




nextWeekDay(periodicidad:any, fecha?:Date) {
  let hoy = new Date();
  if (fecha) hoy = fecha;
  let proximoDia:number =-1;
  let nextFecha;
  for(let currentDay= hoy.getDay();currentDay<6;currentDay++){
    if (periodicidad.dias[currentDay].checked == true){
      proximoDia = 7 + currentDay - (hoy.getDay()-1);
      break;
    }
  }
  if (proximoDia ==-1){
      for(let currentDay= 0;currentDay<hoy.getDay();currentDay++){
    if (periodicidad.dias[currentDay].checked == true){
      proximoDia = currentDay + 7 - (hoy.getDay()-1);
      break;
    }
  }
}
if(proximoDia >7) proximoDia =proximoDia-7;
nextFecha = moment().add(proximoDia,"days");
return nextFecha;
}

nextMonthDay(limpieza: checkLimpieza, periodicidad: any){
  let  proximafecha;
  let fecha_prevista = new Date(limpieza.fecha_prevista);
  let mes = fecha_prevista.getMonth() +1 + periodicidad.frecuencia;
 
if (periodicidad.numsemana ==5){
 let ultimodia =  moment(fecha_prevista).add(periodicidad.frecuencia,"M").endOf('month').isoWeekday() - periodicidad.nomdia;
  proximafecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M").endOf('month').subtract(ultimodia,"days");
}else{
let primerdia = 7 - ((moment(fecha_prevista).add(periodicidad.frecuencia,"M").startOf('month').isoWeekday()) - periodicidad.nomdia)
if (primerdia >6) primerdia= primerdia-7;
 proximafecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M").startOf('month').add(primerdia,"days").add(periodicidad.numsemana-1,"w");
}
return  proximafecha;
}
nextYearDay(limpieza: checkLimpieza, periodicidad: any){
  let proximafecha;
  let fecha_prevista = new Date(limpieza.fecha_prevista);
  let mes = parseInt(periodicidad.mes) -1;
  fecha_prevista = moment(fecha_prevista).month(mes).add(periodicidad.frecuencia,'y').toDate();

if (periodicidad.numsemana ==5){
 let ultimodia =  moment(fecha_prevista).endOf('month').isoWeekday() - periodicidad.nomdia;
 proximafecha = moment(fecha_prevista).endOf('month').subtract(ultimodia,"days");
}else{
let primerdia = 7 - ((moment(fecha_prevista).startOf('month').isoWeekday()) - periodicidad.nomdia)
if (primerdia >6) primerdia= primerdia-7;
 proximafecha = moment(fecha_prevista).startOf('month').add(primerdia,"days").add(periodicidad.numsemana-1,"w");
}
return proximafecha;
}
}
