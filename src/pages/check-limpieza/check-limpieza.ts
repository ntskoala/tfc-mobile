import { Component } from '@angular/core';
//import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { NavController, NavParams, AlertController,ActionSheetController, Events } from 'ionic-angular';

//import { CheckLimpiezaPage } from './check-limpieza';


import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import {Servidor} from '../../providers/servidor';
import { PeriodosProvider } from '../../providers/periodos/periodos';

import { Network } from '@ionic-native/network';
import { URLS, checkLimpieza,limpiezaRealizada, Incidencia } from '../../models/models'
import { IncidenciasPage } from '../incidencias/incidencias';

import * as moment from 'moment'; 
import { ElementRef } from '@angular/core/src/linker/element_ref';
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
public incidencias:Incidencia[]=[];
public hayIncidencia:any[];
public indexIncidenciaActivada:number;
public checks:boolean[];
public idlimpiezazona:number;
public limpiezaRealizada: limpiezaRealizada;
public hoy: Date = new Date();
public fecha_prevista: Date;
//public periodicidad: any;
public hayRetraso: number;
public autocompletar:boolean=false;
public numProcesados:number;
public idempresa = localStorage.getItem("idempresa");
public idusuario = sessionStorage.getItem("idusuario");
// public bloqueaCheck:number;
  constructor(public navCtrl: NavController, private params: NavParams, private alertCtrl: AlertController, 
    public actionSheetCtrl: ActionSheetController, public network:Network,public db: SQLite, 
    private translate: TranslateService,public camera: Camera, private sync: SyncPage, private initdb: Initdb, 
    public servidor: Servidor, public periodos: PeriodosProvider, public events: Events) {
       console.debug("param",this.params.get('limpieza'));
       
      this.idlimpiezazona =  this.params.get('limpieza').idlimpiezazona;
      this.nombreLimpieza = this.params.get('limpieza').nombrelimpieza;
      this.fecha_prevista = this.params.get('limpieza').fecha;
      //this.periodicidad = JSON.parse(this.params.get('limpieza').periodicidad);
      //this.limpieza.id =1;
      //this.limpieza.nombreLimpieza ="test";

  }

ionViewDidLoad() {

  }
ionViewDidEnter(){
  if (!this.checks) {
    console.log('crea Checks',this.checks);
    this.checks=[];
  }else{
    if (this.indexIncidenciaActivada>-1){
      this.hayIncidencia[this.indexIncidenciaActivada]=false;
      this.checks[this.indexIncidenciaActivada]=false;
    }
  }
    console.log('ionViewDidEnter CheckLimpiezaPage',this.checks);


    this.getLimpiezas();


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


getLimpiezas(){
  this.checkLimpiezas =[];
  //this.hayIncidencia=[];
   let fecha = moment(new Date()).format('YYYY-MM-DD');
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  db2.executeSql("Select * FROM checklimpieza WHERE idlimpiezazona = ? AND idusuario = ? AND fecha <= ?", [this.idlimpiezazona, sessionStorage.getItem("idusuario"),fecha]).then((data) => {
                  
                  console.debug(data.rows.length);
                      for (var index=0;index < data.rows.length;index++){
                        let isbeforedate = moment(data.rows.item(index).fecha).isBefore(this.hoy,'day');
                        let repeticion = this.checkPeriodo(data.rows.item(index).periodicidad);
                        let check =false;
                        if (!this.hayRetraso && repeticion != "por uso"){
                      this.hayRetraso = this.periodos.hayRetraso(data.rows.item(index).fecha,JSON.parse(data.rows.item(index).periodicidad));
                        }
                        if(this.checks){
                        if (this.checks[index]) {
                          // this.bloqueaCheck;
                          check = true;
                        };
                        }
//id , idlimpiezazona ,idusuario , nombrelimpieza , idelemento , nombreelementol , fecha , tipo , periodicidad , productos , protocolo
                        this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idlimpiezazona,data.rows.item(index).nombrelimpieza,data.rows.item(index).idelemento,
                        data.rows.item(index).nombreelementol,data.rows.item(index).fecha,data.rows.item(index).tipo,data.rows.item(index).periodicidad,data.rows.item(index).productos,
                        data.rows.item(index).protocolo,check,data.rows.item(index).idusuario,data.rows.item(index).responsable,repeticion,isbeforedate,data.rows.item(index).supervisor));
                        //this.checkLimpiezas.push(data.rows.item(index));
                        
                    }
                    if (!this.hayIncidencia) this.hayIncidencia = new Array(this.checkLimpiezas.length)
                    console.log ("hayIncidencias:", this.hayIncidencia);
                  console.log ("checkLimpiezas:", this.checkLimpiezas);
              }, (error) => {
                  console.debug("ERROR home. 342-> " + JSON.stringify(error.err));
                  alert("error home. 342" + JSON.stringify(error.err));
              }); 
                  });
}

checkPeriodo(periodicidad):string{
let repeticion;
repeticion = JSON.parse(periodicidad)
return repeticion.repeticion;
}

terminar(){
  console.debug("terminar",this.checkLimpiezas);
  this.numProcesados = this.checkLimpiezas.filter(element=>element.checked==true).length;
  let x = 0;
  this.checkLimpiezas.forEach((elemento)=>{
    console.log("terminar2",elemento.nombreElementoLimpieza,elemento.checked,elemento.periodicidad);
if (elemento.checked){
  let fecha;
  (this.autocompletar)? fecha = moment(elemento.fecha_prevista).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:mm'): fecha= moment(this.hoy).format('YYYY-MM-DD HH:mm');
  this.guardarLimpiezaRealizada(elemento,fecha,x)
  console.log("TERMINAR",elemento);

}
x++;
});


}

guardarLimpiezaRealizada(elemento: checkLimpieza, fecha:Date, x?){

  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
    let fecha_prevista =  moment(elemento.fecha_prevista).format('YYYY-MM-DD');

    // if (elemento.descripcion =="por uso"){
    //   fecha_prevista = moment(new Date()).format('YYYY-MM-DD');
    // }else{
    //   fecha_prevista =  moment(elemento.fecha_prevista).format('YYYY-MM-DD');
    // }

    // (this.autocompletar)? fecha = moment(this.fecha_prevista).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:MM'): fecha= moment(this.hoy).add('h',this.hoy.getUTCHours()).add('m',this.hoy.getUTCMinutes()).format('YYYY-MM-DD HH:MM');

      db2.executeSql('INSERT INTO resultadoslimpieza (idelemento, idempresa, fecha_prevista,fecha, nombre, descripcion, tipo, idusuario, responsable,  idlimpiezazona, idsupervisor ) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        //[0,0,'2017-05-29','test','rtest','interno',0,'jorge',0]).then(
        [elemento.idElementoLimpieza,this.idempresa,fecha_prevista,fecha,elemento.nombreLimpieza + " " + elemento.nombreElementoLimpieza,elemento.descripcion,elemento.tipo,this.idusuario,elemento.responsable,elemento.idLimpieza,elemento.supervisor]).then(
  (Resultado) => {
    console.log("INSERTED ResultadoLimpieza:",Resultado, x, this.hayIncidencia[x] )
    if (this.hayIncidencia[x] > 0){
      db2.executeSql('UPDATE incidencias set idElemento = ? WHERE id = ?',[Resultado.insertId,this.hayIncidencia[x]]).then(
        (Resultado) => { console.log("update_Incidencia_ok:",Resultado);}
        ,
        (error) => {
        console.log('ERROR UPDATE INCIDENCIA',JSON.stringify(error))
        });
    }
      this.updateFecha(elemento,fecha);
      localStorage.setItem("syncchecklimpieza", (parseInt(localStorage.getItem("syncchecklimpieza")) + 1).toString());
      this.initdb.badge += 1;
      //console.log("updated fecha: ",proxima_fecha,elemento.fecha_prevista);
  },
  (error) => {console.log("eeror",error)});
},
  (error) => {console.log("eeror",error)});
}


updateFecha(elemento: checkLimpieza,fecha : Date){
  console.log("###updating fecha",elemento);
//updateFecha(fecha,completaFechas, idElemento){
  let proxima_fecha;
  let periodicidad = JSON.parse(elemento.periodicidad);
  if (moment(fecha).isValid() && periodicidad.repeticion != "por uso") {
    proxima_fecha = moment(this.periodos.nuevaFecha(periodicidad,fecha,this.autocompletar)).format('YYYY-MM-DD');
  } else {
    proxima_fecha = moment(this.periodos.nuevaFecha(periodicidad,this.hoy)).format('YYYY-MM-DD');
  }
  
  console.log("updating fecha",proxima_fecha);
  if (moment(proxima_fecha).isAfter(moment(),'day') || periodicidad.repeticion == "por uso"){
    console.log("updateFecha 1",elemento);
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
  //******UPDATE FECHA LOCAL*/
  //******UPDATE FECHA LOCAL*/
  db2.executeSql('UPDATE checklimpieza set  fecha = ? WHERE id = ?',[proxima_fecha,elemento.id]).then
  ((Resultado) => {
       console.log("updated fecha:2 ", Resultado);
  },
  (error) => {
    console.debug('ERROR ACTUALIZANDO FECHA', error);
   });
    });      
    this.numProcesados--;  
    if (this.network.type != 'none') {
      console.log("conected**");
      if (this.numProcesados==0) {
        this.events.publish('sync',{'estado':'start'});
        console.log('***START SENDED');
        this.sync.sync_checklimpieza();
      }
    }
    else {
      console.log("update badge syncchecklimpieza");
      //this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));
    }
    
    if (this.numProcesados==0) setTimeout(()=>{
        this.navCtrl.pop()
        },500);
    
        }else{

          // console.log("sigue programando: ",proxima_fecha);
          // this.fecha_prevista = proxima_fecha;
          // this.terminar();
          console.log("sigue programando: ",proxima_fecha);
          elemento.fecha_prevista = proxima_fecha;
          //limpiezaRealizada.fecha_prevista = proxima_fecha;
          //(limpiezaRealizada.fecha = proxima_fecha;
          this.guardarLimpiezaRealizada(elemento,proxima_fecha);
        }
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
        // {text: incorrecto,icon:'close-circle',handler: () => {control.checked='false';control.valor = '';}},
        // {text: aplica,icon:'help-circle',handler: () => {control.checked='na';control.valor = '';}},
      //  {text: valor,icon:'information-circle',handler: () => {this.setValor(control);}},
      //  {text: descrip,icon:'clipboard',handler: () => {this.editar(control);}},
      //  {text: 'Foto',icon:'camera',handler: () => {this.takeFoto(control);}},
        {text: cancel,role: 'cancel',handler: () => {console.debug('Cancel clicked');}}
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
        while (moment(proximaFecha).isSameOrBefore(moment())){
        limpieza.fecha_prevista = proximaFecha;
        proximaFecha = moment(limpieza.fecha_prevista).add(periodicidad.frecuencia,"w");
        }
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

nuevaIncidencia(evento,elementoLimpieza,i){
  console.log(evento);
  console.log(this.hayIncidencia[i],typeof(this.hayIncidencia[i]));
  if (!this.hayIncidencia[i]){
    this.hayIncidencia[i]=false;
  }else{
  this.checks[i] = true;
  this.indexIncidenciaActivada = i;
  let incidencia = 'Incidencia en ' + elementoLimpieza.nombreElementoLimpieza + ' en Zona '  + this.nombreLimpieza;
  let descripcion = ''
  let params= new Incidencia(null,null,incidencia,null,parseInt(sessionStorage.getItem("iduser")),
  parseInt(localStorage.getItem("idempresa")),'Limpiezas',null ,'limpieza_realizada',this.idlimpiezazona,null,descripcion,-1)
  this.navCtrl.push(IncidenciasPage,params);
  this.events.subscribe('nuevaIncidencia',(param)=>{
    this.hayIncidencia[i] = param.idLocal;
    this.indexIncidenciaActivada=-1;
    console.log(i,this.hayIncidencia);
    
    this.events.unsubscribe('nuevaIncidencia');
  })
}

}

clickCheck(i){
  if (event){
  console.log(event);
  this.checks[i]= !this.checks[i];
  console.log(this.checks);
  }else{
    console.log('bloqueado el cambio por carga inicial');
  }
}




}
