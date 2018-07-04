import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { AlertController,ActionSheetController } from 'ionic-angular';

//import { CheckLimpiezaPage } from './check-limpieza';


import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import {IncidenciasPage} from '../incidencias/incidencias';
import { Initdb } from '../../providers/initdb';
import {Servidor} from '../../providers/servidor';
import {PeriodosProvider} from '../../providers/periodos/periodos';

import { Network } from '@ionic-native/network';
import { URLS,mantenimientoRealizado, Incidencia } from '../../models/models'

import * as moment from 'moment'; 
/**
 * Generated class for the MantenimientoPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-mantenimiento',
  templateUrl: 'mantenimiento.html',
  providers: [SyncPage]
})

export class MantenimientoPage {
  
  public nombreMaquina: string;
  public nombre: string;
  public id:number;
  public idMaquina:number;
  public mantenimientoRealizado: mantenimientoRealizado;
  public fechaPrevista: Date;
  public periodicidad:string;
  public responsable:string;
  public tipo:string;
  public hoy: Date = new Date();
  public isbeforedate: boolean=false;
  public hayRetraso:number;
  public autocompletar:boolean=false;
  public checked: boolean=false;
  public imagen:string="";
  public icono:string;
  public entidad:string;
  public descripcion:string="";
  public causas:string ="";
  public hayIncidencia: number = 0;

  constructor(public navCtrl: NavController, private params: NavParams, private alertCtrl: AlertController, 
    public actionSheetCtrl: ActionSheetController, public network:Network,public db: SQLite, 
    private translate: TranslateService,public camera: Camera, private sync: SyncPage, private initdb: Initdb, 
    public servidor: Servidor, public periodos: PeriodosProvider, public events: Events) {
      console.debug("param",this.params.get('mantenimiento'));
      
     this.id =  this.params.get('mantenimiento').id;
     this.idMaquina=  this.params.get('mantenimiento').idMaquina;
     this.nombreMaquina = this.params.get('mantenimiento').nombreMaquina;
     this.nombre = this.params.get('mantenimiento').nombre;
     this.fechaPrevista = new Date(this.params.get('mantenimiento').fecha);
     this.periodicidad = JSON.parse(this.params.get('mantenimiento').periodicidad);
     this.responsable = this.params.get('mantenimiento').responsable;
     this.tipo = this.params.get('mantenimiento').tipo;
     this.isbeforedate = moment(this.fechaPrevista).isBefore(this.hoy,'day');
     this.entidad = this.params.get('entidad');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MantenimientoPage');
  }

ionViewDidEnter() {
  if ( this.entidad == 'maquina_mantenimiento'){
  this.icono = 'assets/img/machine.png';
  }else{
    this.icono = 'assets/img/balance.png'
  }


console.log ("icono",this.icono);
  if (this.network.type != 'none'){
    let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
    this.servidor.login(URLS.LOGIN, param).subscribe(
      response => {
        if (response.success == 'true') {
          // Guarda token en sessionStorage
          localStorage.setItem('token', response.token);
          }
          });
  }

  this.hayRetraso = this.periodos.hayRetraso(this.fechaPrevista,this.periodicidad);

}


terminar(){
 
  let idempresa = localStorage.getItem("idempresa");
  let idusuario = sessionStorage.getItem("idusuario")
  let elemento = "";
  let tipo2="preventivo";
  let tipo_evento = (this.entidad == "maquina_mantenimiento")?"mantenimiento":"calibracion";
  let fecha;
if (this.checked){
  (this.autocompletar)? fecha = this.fechaPrevista: fecha= this.hoy;
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
    let fecha_prevista =  moment(this.fechaPrevista).format('YYYY-MM-DD');
    fecha = moment(fecha).format('YYYY-MM-DD');

      db2.executeSql('INSERT INTO mantenimientosrealizados (idmantenimiento, idmaquina, maquina, mantenimiento, fecha_prevista,fecha,idusuario, responsable, descripcion, elemento, tipo,tipo2,causas,tipo_evento, idempresa, imagen ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [this.id,this.idMaquina,this.nombreMaquina,this.nombre,fecha_prevista,fecha,idusuario,this.responsable,this.descripcion,elemento,this.tipo,tipo2,this.causas,tipo_evento,idempresa,this.imagen]).then(
  (Resultado) => {
    if (this.hayIncidencia > 0){
      db2.executeSql('UPDATE incidencias set idElemento = ? WHERE id = ?',[Resultado.insertId,this.hayIncidencia]).then(
        (Resultado) => { console.log("update_Incidencia_ok:",Resultado);}
        ,
        (error) => {
        console.log('ERROR UPDATE INCIDENCIA',JSON.stringify(error))
        });
    }
   // let proxima_fecha;
   //   proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,this.fechaPrevista,this.autocompletar)).format('YYYY-MM-DD');

      localStorage.setItem("syncmantenimientos", (parseInt(localStorage.getItem("syncmantenimientos")) + 1).toString());
//?      this.initdb.badge += 1;
      this.updateFecha(this.fechaPrevista,this.autocompletar);
      // db2.executeSql('UPDATE ' + this.entidad + ' set  fecha = ? WHERE id = ?',[proxima_fecha, this.id]).then
      // ((Resultado) => {
      //      console.log("updated fecha: ", proxima_fecha);
      // },
      // (error) => {
      //   console.debug('ERROR ACTUALIZANDO FECHA', error);
      //  });
  },
  (error) => {
    console.debug('ERROR INSERTANDO MR', error);
  });
},
  (error) => {console.debug(JSON.stringify(error))});
}          
}

updateFecha(fecha,completaFechas){
  let proxima_fecha;
  if (moment(fecha).isValid()){
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,fecha,completaFechas)).format('YYYY-MM-DD');
  }else{
    alert('Mal formato en la fecha ' + fecha + ' se calculará a partir de hoy ' +this.hoy);
    proxima_fecha = moment(this.periodos.nuevaFecha(this.periodicidad,this.hoy)).format('YYYY-MM-DD');
  }    
  //console.log("updating fecha",proxima_fecha);
  if (moment(proxima_fecha).isAfter(moment(),'day')){
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql('UPDATE ' + this.entidad + ' set  fecha = ? WHERE id = ?',[proxima_fecha, this.id]).then
      ((Resultado) => {
         console.log("updated fecha: ", proxima_fecha);
      },
      (error) => {
        console.debug('ERROR ACTUALIZANDO FECHA', error);
      });  
    });        
    if (this.network.type != 'none') {
      console.debug("conected");
      this.sync.sync_mantenimientos();
    }
    else {
      console.debug("update badge syncmantenimientos");
    }
    this.navCtrl.pop();
        }else{

          console.log("sigue programando: ",proxima_fecha);
          this.fechaPrevista = proxima_fecha;
          this.terminar();
        }
}

takeFoto(){
//  this.imagen = "data:image/jpeg;base64,";
  this.camera.getPicture({
        destinationType: this.camera.DestinationType.DATA_URL,
        quality: 50,
        targetWidth: 300,
        targetHeight: 300,
        correctOrientation: true
    }).then((imageData) => {
      // imageData is a base64 encoded string
        this.imagen = "data:image/jpeg;base64," + imageData;
        
    }, (err) => {
        console.debug(err);
    });
  }

nuevaIncidencia(){
  let incidencia = 'Incidencia con ' + this.nombre + ' de ' + this.nombreMaquina;
  let params= new Incidencia(null,null,incidencia,'',parseInt(sessionStorage.getItem("iduser")),
  parseInt(localStorage.getItem("idempresa")),'Maquinaria',null ,'mantenimientos_realizados',this.idMaquina,this.imagen,'',-1)
  this.navCtrl.push(IncidenciasPage,params);
  this.events.subscribe('nuevaIncidencia', (param) => {
    // userEventData is an array of parameters, so grab our first and only arg
    console.log('Id Incidencia Local', param);
    this.hayIncidencia = param.idLocal;
  });
}

}
