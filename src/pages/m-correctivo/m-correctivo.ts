import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AlertController,ActionSheetController } from 'ionic-angular';

//import { CheckLimpiezaPage } from './check-limpieza';


import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';
import {Servidor} from '../../providers/servidor';
import {PeriodosProvider} from '../../providers/periodos/periodos';

import { Network } from '@ionic-native/network';
import { URLS,mantenimientoRealizado, maquina } from '../../models/models'

import * as moment from 'moment'; 
/**
 * Generated class for the MCorrectivoPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-m-correctivo',
  templateUrl: 'm-correctivo.html',
  providers: [SyncPage]
})
export class MCorrectivoPage {
  public maquinas: maquina[];
  public piezas:object[];
  public machine: number;
  public nombreMaquina:string;
  public mantenimientoRealizado: mantenimientoRealizado;
  public hoy: Date = new Date();
  public imagen:string="";

  constructor(private params: NavParams, private navCtrl: NavController, private alertCtrl: AlertController, 
    public actionSheetCtrl: ActionSheetController, public network:Network,public db: SQLite, 
    private translate: TranslateService,public camera: Camera, private sync: SyncPage, private initdb: Initdb, 
    public servidor: Servidor, public periodos: PeriodosProvider) {
      this.mantenimientoRealizado = new mantenimientoRealizado(null,null,null,null,'',moment(this.hoy).toDate(),
        moment(this.hoy).toDate(),parseInt(localStorage.getItem("idusuario")),'','','',"interno","correctivo",
        '','',parseInt(localStorage.getItem("idempresa")),'');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MCorrectivoPage');
  }
  ionViewDidEnter() {

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
    this.getMaquinas();
    

  }
  getMaquinas(){

    this.maquinas =[];

                    //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    //this.checklistList = data.rows;
                    this.db.create({name: "data.db", location: "default"}).then((sql: SQLiteObject) => {
                    sql.executeSql("Select * FROM maquinas ORDER BY nombreMaquina", []).then(
                      (data) => {
                    console.log('NUM Maquinas:',data.rows.length);
                        for (var index=0;index < data.rows.length;index++){
                          this.maquinas.push(new maquina(data.rows.item(index).idMaquina, data.rows.item(index).nombreMaquina));
                      }
                    console.log ("Maquinas:", this.maquinas);
                }, (error) => {
                    console.log("ERROR home maquinas. 823-> ", error);
                    alert("error home Maquinas. 824" + error);
                }); 
               //});
               console.log("Fin  Maquinas",new Date());
  });
}


terminar(){

if (this.machine >0){
  
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
  let fecha = moment(this.mantenimientoRealizado.fecha).format('YYYY-MM-DD');

      db2.executeSql('INSERT INTO mantenimientosrealizados (idmantenimiento, idmaquina, maquina, mantenimiento, fecha_prevista,fecha,idusuario, responsable, descripcion, elemento, tipo,tipo2,causas,tipo_evento, idempresa, imagen, pieza,cantidadPiezas ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [0,this.machine,this.nombreMaquina,
          this.mantenimientoRealizado.mantenimiento,fecha,fecha,this.mantenimientoRealizado.idusuario,
          this.mantenimientoRealizado.responsable,this.mantenimientoRealizado.descripcion,
          this.mantenimientoRealizado.elemento,this.mantenimientoRealizado.tipo,
          this.mantenimientoRealizado.tipo2,this.mantenimientoRealizado.causas,
          this.mantenimientoRealizado.tipo_evento,this.mantenimientoRealizado.idempresa,this.imagen,
        this.mantenimientoRealizado.pieza,this.mantenimientoRealizado.cantidadPiezas]).then(
  (Resultado) => {

      localStorage.setItem("syncmantenimientos", (parseInt(localStorage.getItem("syncmantenimientos")) + 1).toString());
      //this.initdb.badge += 1;
      if (this.network.type != 'none') {
        console.debug("conected");
        this.sync.sync_mantenimientos();
        this.navCtrl.pop();
      }
      else {
        console.debug("update badge syncmantenimientos");
        this.navCtrl.pop();
      }
      
  },
  (error) => {
    console.debug('ERROR INSERTANDO MR', error);
  });
},
  (error) => {console.debug(JSON.stringify(error))});

}else{
  //NO HAY MAQUINA
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

cambia(id:number){
  let index = this.maquinas.findIndex((maquina)=>maquina.idMaquina == id)
  this.nombreMaquina = this.maquinas[index].nombreMaquina;
  console.log('CAMBIO MAQUINA:',id,index,this.maquinas[index].idMaquina);
  this.getPiezas(this.maquinas[index].idMaquina);
}
cambiaPieza(idPieza:number){
console.log(idPieza);
}

getPiezas(idMaquina){
  console.log(idMaquina)
  this.piezas =[];
  this.db.create({name: "data.db", location: "default"}).then((sql: SQLiteObject) => {
  sql.executeSql("Select * FROM piezas WHERE idmaquina = ? ORDER BY id", [idMaquina]).then(
    (data) => {
  console.log('NUM Piezas:',data.rows.length);
      for (var index=0;index < data.rows.length;index++){
        this.piezas.push({'id':data.rows.item(index).id, 'nombre':data.rows.item(index).nombre});
    }
    this.piezas.unshift({'id':0, 'nombre':'ninguna'});
  console.log ("piezas:", this.piezas);
}, (error) => {
  console.log("ERROR pieszas.-> ", error);
  //alert("error home Maquinas. 824" + error);
}); 
//});
console.log("Fin  Piezas");
});

}
}