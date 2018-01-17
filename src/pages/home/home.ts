import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NavController, MenuController, NavParams } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import {LoginPage} from '../login/login';
import {ControlPage} from '../control/control';
import { CheckPage } from '../check/check';
import { SyncPage } from '../sync/sync';
import { CheckLimpiezaPage } from '../check-limpieza/check-limpieza';
import { MantenimientoPage } from '../mantenimiento/mantenimiento';
import { MCorrectivoPage } from '../m-correctivo/m-correctivo';

import { SupervisionPage } from '../supervision/supervision';
import {Empresa} from '../empresa/empresa';
import { Sync } from '../../providers/sync';
import { Servidor } from '../../providers/servidor';
import { Initdb } from '../../providers/initdb'

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { URLS, controlesList, checklistList, checkLimpieza, mantenimiento, limpiezaRealizada,supervisionLimpieza, mantenimientoRealizado, maquina } from '../../models/models'
import * as moment from 'moment';
import { setTimeout } from 'timers';





@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [SyncPage]

})
export class HomePage {
miscontroles: any;
mischecks: any;
mischeckslimpiezas: any;
mismantenimientos: any;
miscalibraciones: any;
mismaquinas:any;
mislimpiezasrealizadas: any;
public cambio: number;
accesomenu: any;
public logoempresa;
public empresa =0;
public controlesList: controlesList[] =[];
public checklistList: checklistList[] = [];
public checkLimpiezas: checkLimpieza[] = [];
public supervisionLimpiezas: supervisionLimpieza[] = [];
public mantenimientos: mantenimiento[]=[];
public calibraciones: mantenimiento[]=[];
public maquinas: maquina[]=[];
public loader:any;
public status:boolean[]=[false,false,false,false,false,false];
public sql: SQLiteObject;
public Momento = moment();
public cargando: boolean=false;
public tipoUser: string=localStorage.getItem("tipoUser");
  constructor(public navCtrl: NavController, menu: MenuController, private data:Initdb, private sync: Sync,public syncPage: SyncPage,private servidor: Servidor, public db :SQLite,public network:Network,public loadingCtrl: LoadingController, public params: NavParams) {
    this.network.onDisconnect().subscribe(
      estado=>{
        console.debug('desconectado diferencia:',estado.timeStamp - this.data.momentoCambioEstado);
        this.data.hayConexion = false;
        if(estado.timeStamp - this.data.momentoCambioEstado > 1){
          this.data.momentoCambioEstado = estado.timeStamp;
        }else{
          console.debug('poca diferencia', estado.timeStamp - this.data.momentoCambioEstado);
        }
      }
    );
    this.network.onConnect().subscribe(
        estado=>{
          console.debug('conectado diferencia:',estado.timeStamp - this.data.momentoCambioEstado);
          this.data.momentoCambioEstado = estado.timeStamp;
          console.debug ('lestado conexion',this.data.hayConexion);
          if (!this.data.hayConexion){
            console.debug ('se procesará si badge',estado);
          this.data.hayConexion = true;
          let badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"));
          if (badge > 0){
            this.syncData();
          }
        }
        }
      );

      this.cargando = true;
    let login = this.data.logged;
        if ((login === undefined || login == null)) {
          this.navCtrl.setRoot(LoginPage);
        } else {
          this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            this.sql = db2;
//            if (!this.cargando) this.cargaListas();
          if (this.network.type != 'none') {
            if (localStorage.getItem("versioncontrols") === null) {
              this.callSincroniza();
            } else {
              this.hayUpdates().then(
                (versionActual) => {
                  console.debug("versionActual Controles", versionActual);
                  if (versionActual > parseInt(localStorage.getItem("versioncontrols"))) {
                    this.callSincroniza(versionActual);
                  } else {
                    this.cargaListas();
                  }
                });
            }
            this.refreshlogo();
          } else {
            alert('No hay conexión, para sincronizar los datos');
            this.cargaListas();
          }
          });
        }
}

ionViewDidLoad(){
  this.cambio=0;
  

}
ionViewDidEnter(){
  console.debug("didEnter...");
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
    this.sql = db2;
  if (!this.cargando) this.cargaListas();
  });
  // if (this.params.get('origen')== 'checkLimpiezas'){
  //   alert('from limpiezas' + + this.params.get('limpieza') + this.params.get('eliminar'))
  // }
}

syncData(){
        console.debug ('a sincronizar');
            this.syncPage.sync_data();
}



callSincroniza(versionActual?){
  this.Momento = moment();
  console.debug("Inicio callSincroniza",this.Momento.format("mm:ss"));
              this.presentLoading();
              if (versionActual) versionActual = versionActual.toString();
              this.sincronizate(versionActual).subscribe(
              (valor)=>{
                console.debug("1", valor);
                switch(valor){
                  case "controles":
                    this.status[0] = true;
                    break;
                  case "checklists":
                  this.status[1] = true;
                  break;
                  case "limpiezas":
                  this.status[2] = true;
                  break;
                  case "mantenimientos":
                  this.status[3] = true;
                  break;
                  case "calibraciones":
                  this.status[4] = true;
                  break;
                  case "maquinas":
                  this.status[5] = true;
                  break;
                  case "limpiezasRealizadas":
                  this.status[6] = true;
                  break;
                }
                console.debug(this.status, moment(this.Momento).diff(moment(), 'seconds'));
                if (this.status[0] && this.status[1] && this.status[2] && this.status[3] && this.status[4] && this.status[5]  && this.status[6]){
                 console.debug("STATUS 6", moment(this.Momento).diff(moment(), 'seconds'));

                  if (!(versionActual>0)) localStorage.setItem("versioncontrols","0");
                  setTimeout(()=>{ 
                    this.cargaListas();
                    this.status=[false,false,false,false,false,false];
            this.closeLoading();
            },500);
                }
              },
              (error)=>console.debug(error)
            );
}

cargaListas(){
  this.cargando=true;
  console.debug("Inicio CargaListas", moment(this.Momento).diff(moment(), 'seconds'));
            this.getControles();
            this.getChecklists();
            this.getLimpiezas();
            this.getLimpiezasRealizadas();
            if (localStorage.getItem("tipoUser")=='Mantenimiento'){
              this.getMantenimientos();
              this.getCalibraciones();
            }
  console.debug("Fin CargaListas", moment(this.Momento).diff(moment(), 'seconds')); 
  setTimeout(()=>{
    this.cargando = false;
  },100);
}

hayUpdates() {
    let updates:number = -1;
    let parametros = '&idempresa=' + localStorage.getItem("idempresa")+"&entidad=empresas";
    return new Promise(resolve => {
        this.servidor.getObjects(URLS.VERSION_USERS, parametros).subscribe(
          response => {

            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                updates = element.updatecontrols;
              }
              resolve(updates);
            }
        },
        (error)=>{
          console.debug(error)
          resolve('Error en hay updates() home# 161' + updates);
      },
        ()=>{
            
        });
    });
        //return updates;
   }




refreshlogo(){
  this.empresa = parseInt(localStorage.getItem("idempresa"));
this.logoempresa = URLS.SERVER + "logos/"+localStorage.getItem("idempresa")+"/logo.jpg";

}
sincronizate(version? : string){
  console.debug("sincronizando...");
 //CONTROLES
   //CONTROLES
   // DESCARGA CONTROLES ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
    return new Observable((response)=> {     
            this.sync.getMisControles(this.data.logged).subscribe(
            data => {
              //test
              this.miscontroles = JSON.parse(data.json());
              console.debug('resultado' + this.miscontroles.success);
              //console.debug('success: ' +this.miscontroles.data[0].nombre);
              if (this.miscontroles.success){
              //test
               this.miscontroles = this.miscontroles.data;
               if (this.miscontroles){
                //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("delete from controles",[]).then((data) => {
                      //console.debug(JSON.stringify(data.res));
                      let argumentos=[];
                      let valores='';
                      this.miscontroles.forEach (control => {
                        //this.saveControl(control)
                       argumentos.push ('(?,?,?,?,?,?,?,?,?,?,?,?)');
                       valores += "("+control.id+","+control.idusuario+",'"+control.nombre+"','"+control.pla+"',"+control.valorminimo+","+control.valormaximo+","+control.objetivo+","+control.tolerancia+","+control.critico+",'"+control.fecha_+"','"+control.periodicidad2+"','"+this.checkPeriodo(control.periodicidad2)+"'),";           
                      });
                      valores = valores.substr(0,valores.length-1);
                       let query = "INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico,fecha,periodicidad,frecuencia) VALUES" + valores;
                       console.debug('########',query);

                      this.sql.executeSql("INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico,fecha,periodicidad,frecuencia) VALUES" + valores ,[])
                      .then((data) => {
                        console.debug('***********OK INSERT CONTROLES', data)
                      },
                      (error)=>{ 
                        console.debug('***********ERROR CONTROLES', error)
                      });

                      }, (error) => {
                      console.debug("ERROR -> " + JSON.stringify(error));
                      //alert("Error 1");
                    } );

                //});
               }
                response.next('controles');
               //this.miscontroles.forEach (control => this.saveControl(control));
              }
            },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
             // this.getControles();
            }

        );  

        //CONTROLES
        //CONTROLES
 //CHECKLISTS
   //CHECKLISTS
   // DESCARGA CHECKLISTS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
            this.sync.getMisChecklists(this.data.logged).map(res => res.json()).subscribe(
            data => {
               this.mischecks = JSON.parse(data);
                    console.debug('resultado check: ' + this.mischecks.success);
                //    console.debug('success check: ' +this.mischecks.data[0].nombre);
                if (this.mischecks.success){
                  console.debug ("if");
                  //test
                    this.mischecks = this.mischecks.data;
                    if (this.mischecks){
                    console.debug("mischecklists: " + this.mischecks);
                   //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    this.sql.executeSql("delete from checklist",[]).then((data) => {
                      console.debug("total chacklists:",this.mischecks.length);
                      let argumentos=[];
                      let valores='';
                      this.mischecks.forEach (checklist => {
                       // this.saveChecklist(checklist)
                       argumentos.push ('(?,?,?,?,?,?,?,?)');
                        valores += "("+checklist.idchecklist+","+checklist.idusuario+",'"+checklist.nombrechecklist+"',"+checklist.id+",'"+checklist.nombre+"','"+checklist.fecha_+"','"+checklist.periodicidad2+"','"+this.checkPeriodo(checklist.periodicidad2)+"'),";
                       //valores.push([fila]);
                      });
                      valores = valores.substr(0,valores.length-1);
                      let query = "INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol,fecha,periodicidad,frecuencia) VALUES " + valores;
                      console.debug('########',query);
                      this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol,fecha,periodicidad,frecuencia) VALUES " + valores ,[])
                      .then((data) => {
                        console.debug('***********OK INSERT CHECKLIST', data)
                      },
                      (error)=>{ console.debug('***********ERROR CHECKLISTS', error)});
                         
                  //this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES ("+checklist+")").then((data) => {console.debug('*****************FIN')});

                      console.debug(JSON.stringify(data.res));
                      }, (error) => {
                      console.debug("ERROR -> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                //});
                    }
                response.next('checklists');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              //this.getChecklists();
            }
        );  
        //CHECKLISTS
        //CHECKLISTS


 //LIMPIEZAS
   //LIMPIEZAS
   // DESCARGA LIMPIEZAS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
            this.sync.getMisLimpiezas(this.data.logged).map(res => res.json()).subscribe(
            data => {
               this.mischeckslimpiezas = JSON.parse(data);
                    console.debug('resultado checklimpieza: ' + this.mischeckslimpiezas.success);
                //    console.debug('success check: ' +this.mischecks.data[0].nombre);
                if (this.mischeckslimpiezas.success){
                  console.debug ("if");
                  //test
                    this.mischeckslimpiezas = this.mischeckslimpiezas.data;
                    if (this.mischeckslimpiezas){
                    console.debug("mischecklistslimpiezaas: " + this.mischeckslimpiezas);
                 //  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    this.sql.executeSql("delete from checklimpieza",[]).then((data) => {
                      let argumentos=[];
                      let valores='';
                      this.mischeckslimpiezas.forEach (checklimpieza => 
                    {
                      //    this.saveChecklimpieza(checklimpieza)

                       argumentos.push ('(?,?,?,?,?,?,?)');
                       valores += "("+checklimpieza.idlimpiezazona+","+checklimpieza.idusuario+",'"+checklimpieza.nombrelimpieza+"',"+checklimpieza.id+",'"+checklimpieza.nombre+"','"+checklimpieza.fecha+"','"+checklimpieza.tipo+"','"+checklimpieza.periodicidad+"','"+checklimpieza.productos+"','"+checklimpieza.protocolo+"','"+checklimpieza.responsable+"'),";           
                      });
                      valores = valores.substr(0,valores.length-1);
                      //idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
                      let query = "INSERT INTO checklimpieza ( idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES " + valores;
                      console.debug('########',query);

                      this.sql.executeSql(query,[])
                      .then((data) => {
                        console.debug('***********OK INSERT LIMPIEZASREALIZADAS', data)
                      },
                      (error)=>{ console.debug('***********ERROR CHECKLIMPIEZA', error)});
                      console.debug(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.debug("ERROR home. 211 delete mislimpiezas-> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                //});
                    }
                  response.next('limpiezas');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
             // this.getChecklists();
            }
        );  
        //LIMPIEZAS
        //LIMPIEZAS

  //MANTENIMIENTOS
   //MANTENIMIENTOS
   // DESCARGA MANTENIMIENTOS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
   this.sync.getMisMantenimientos(this.data.logged).map(res => res.json()).subscribe(
    data => {
       this.mismantenimientos = JSON.parse(data);
            console.debug('resultado mantenimientos: ' + this.mismantenimientos.success);
        //    console.debug('success check: ' +this.mischecks.data[0].nombre);
        if (this.mismantenimientos.success){
          //test
            this.mismantenimientos = this.mismantenimientos.data;
            if (this.mismantenimientos){
            console.debug("mismantenimientos: ", this.mismantenimientos);
         //  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            this.sql.executeSql("delete from maquina_mantenimiento",[]).then((data) => {
              let argumentos=[];
              let valores='';
              this.mismantenimientos.forEach (mantenimiento => 
            {
               argumentos.push ('(?,?,?,?,?,?,?)');
               valores += "("+mantenimiento.id+","+mantenimiento.idMaquina+",'"+mantenimiento.nombreMaquina+"','"+mantenimiento.nombre+"','"+mantenimiento.fecha+"','"+mantenimiento.tipo+"','"+mantenimiento.periodicidad+"','"+mantenimiento.responsable+"',"+mantenimiento.orden+"),";           
              });
              valores = valores.substr(0,valores.length-1);
              //idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
              let query = "INSERT INTO maquina_mantenimiento ( id, idMaquina,  nombreMaquina,nombre, fecha, tipo,  periodicidad,responsable,  orden ) VALUES " + valores;
              console.debug('########',query);

              this.sql.executeSql(query,[])
              .then((data) => {
                console.debug('***********OK INSERT maquina_MANTENIMIENTOS', data)
              },
              (error)=>{ console.debug('***********ERROR maquina_MANTENIMIENTOS', error)});
              console.debug(JSON.stringify('deleted maquina_mantenimientos: ',data.res));
              }, (error) => {
              console.debug("ERROR home. 211 delete mismantenimientos-> " + JSON.stringify(error));
              //alert("Error 2");
            } );
        //});
            }
          response.next('mantenimientos');
              //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
          }
      },
    err => console.error(err),
    () => {
      if (version) localStorage.setItem("versioncontrols",version);
     // this.getChecklists();
    }
);  
//MANTENIMIENTOS 
//MANTENIMIENTOS

 //CALIBRACIONES
   //CALIBRACIONES
   // DESCARGA CALIBRACIONES ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
   this.sync.getMisCalibraciones(this.data.logged).map(res => res.json()).subscribe(
    data => {
       this.miscalibraciones = JSON.parse(data);
            console.debug('resultado miscalibraciones: ' + this.miscalibraciones.success);
        //    console.debug('success check: ' +this.mischecks.data[0].nombre);
        if (this.miscalibraciones.success){
          //test
            this.miscalibraciones = this.miscalibraciones.data;
            if (this.miscalibraciones){
            console.debug("miscalibraciones: ", this.miscalibraciones);
         //  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            this.sql.executeSql("delete from maquina_calibraciones",[]).then((data) => {
              let argumentos=[];
              let valores='';
              this.miscalibraciones.forEach (mantenimiento => 
            {
              //    this.saveChecklimpieza(checklimpieza)

              argumentos.push ('(?,?,?,?,?,?,?)');
              valores += "("+mantenimiento.id+","+mantenimiento.idMaquina+",'"+mantenimiento.nombreMaquina+"','"+mantenimiento.nombre+"','"+mantenimiento.fecha+"','"+mantenimiento.tipo+"','"+mantenimiento.periodicidad+"','"+mantenimiento.responsable+"',"+mantenimiento.orden+"),";           
             });
             valores = valores.substr(0,valores.length-1);
             //idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
             let query = "INSERT INTO maquina_calibraciones ( id, idMaquina,  nombreMaquina,nombre, fecha, tipo,  periodicidad,responsable,  orden ) VALUES " + valores;
             console.debug('########',query);

              this.sql.executeSql(query,[])
              .then((data) => {
                console.debug('***********OK INSERT CALIBRACIONES', data)
              },
              (error)=>{ console.debug('***********ERROR CALIBRACIONES', error)});
              console.debug(JSON.stringify('deleted CALIBRACIONES: ',data.res));
              }, (error) => {
              console.debug("ERROR home. 211 delete CALIBRACIONES-> " + JSON.stringify(error));
              //alert("Error 2");
            } );
        //});
            }
          response.next('calibraciones');
              //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
          }
      },
    err => console.error(err),
    () => {
      if (version) localStorage.setItem("versioncontrols",version);
     // this.getChecklists();
    }
);  
//CALIBRACIONES
//CALIBRACIONES

 //MAQUINAS
   //MAQUINAS
   // DESCARGA MAQUINAS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
   this.sync.getMisMaquinas(this.data.logged).map(res => res.json()).subscribe(
    data => {
       this.mismaquinas = JSON.parse(data);
            console.debug('resultado mismaquinass: ' + this.mismaquinas.success);
        //    console.debug('success check: ' +this.mischecks.data[0].nombre);
        if (this.mismaquinas.success){
          //test
            this.maquinas = this.mismaquinas.data;
            if (this.maquinas){
            console.debug("maquinas: ", this.maquinas);
         //  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            this.sql.executeSql("delete from maquinas",[]).then((data) => {
              let argumentos=[];
              let valores='';
              this.maquinas.forEach (maquina => 
            {
              //    this.saveChecklimpieza(checklimpieza)

              argumentos.push ('(?,?)');
              valores += "("+maquina.idMaquina+",'"+maquina.nombreMaquina+"'),";           
             });
             valores = valores.substr(0,valores.length-1);
             //idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
             let query = "INSERT INTO maquinas ( idMaquina,nombreMaquina ) VALUES " + valores;
             console.debug('########',query);

              this.sql.executeSql(query,[])
              .then((data) => {
                console.debug('***********OK INSERT MAQUINAS', data)
              },
              (error)=>{ console.debug('***********ERROR MAQUINAS', error)});
              console.debug(JSON.stringify('deleted MAQUINAS: ',data.res));
              }, (error) => {
              console.debug("ERROR home. 553 delete MAQUINAS-> " + JSON.stringify(error));
              //alert("Error 2");
            } );
        //});
            }
          response.next('maquinas');
              //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
          }
      },
    err => console.error(err),
    () => {
      if (version) localStorage.setItem("versioncontrols",version);
     // this.getChecklists();
    }
);  
//MAQUINAS
//MAQUINAS


 //LIMPIEZAS REALIZADAS
   //LIMPIEZAS REALIZADAS
   // DESCARGA LIMPIEZAS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.

            this.sync.getMisLimpiezasRealizadas(this.data.logged).map(res => res.json()).subscribe(
            data => {
               this.mislimpiezasrealizadas = JSON.parse(data);
                    console.debug('resultado limpiezasRealizadas: ' + this.mislimpiezasrealizadas.success);
                //    console.debug('success check: ' +this.mischecks.data[0].nombre);
                if (this.mislimpiezasrealizadas.success){
                  console.debug ("if LIMPIEZAS REALIZADAS.SUCEESS");
                  //test
                    this.mislimpiezasrealizadas = this.mislimpiezasrealizadas.data;
                    //if (this.mislimpiezasrealizadas){
                    console.debug("mislimpiezasrealizadas: " + this.mislimpiezasrealizadas);
                   //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    this.sql.executeSql("delete from supervisionlimpieza",[]).then((data) => {
                      let argumentos=[];
                      let valores='';
                      if (this.mislimpiezasrealizadas){
                      this.mislimpiezasrealizadas.forEach (limpiezaRealizada => {
                      //  this.saveLimpiezaRealizada(limpiezarealizada)

                       argumentos.push ('(?,?,?,?,?,?,?)');
                       valores += "("+limpiezaRealizada.id+",'"+limpiezaRealizada.nombre+"',"+limpiezaRealizada.idlimpiezazona+",'"+limpiezaRealizada.nombreZona+"','"+limpiezaRealizada.fecha+"','"+limpiezaRealizada.tipo+"','"+limpiezaRealizada.responsable+"',"+limpiezaRealizada.supervisor+","+limpiezaRealizada.supervision+"),";           
                      });
                      valores = valores.substr(0,valores.length-1);
                      let query = "INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza,idZona,nombreZona, fecha, tipo,  responsable, idsupervisor, supervision) VALUES " + valores;
                      console.debug('########',query);

                      this.sql.executeSql(query,[])
                      .then((data) => {
                        console.debug('***********OK INSERT LIMPIEZASREALIZADAS', data)
                      },
                      (error)=>{ console.debug('***********ERROR SUPERVISIONLIMPIEZA', error)});
                    }
                      console.debug(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.debug("ERROR home. 211 delete limpiezas Realizadas-> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                //});
                    //}
                  response.next('limpiezasRealizadas');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              //this.getChecklists();
            }
        );  
        //LIMPIEZAS REALIZADAS
        //LIMPIEZAS REALIZADAS
    });
}

  saveControl(control){
        //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {                
                  this.sql.executeSql("INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico) VALUES (?,?,?,?,?,?,?,?,?)",[control.id,control.idusuario,control.nombre,control.pla,control.valorminimo,control.valormaximo,control.objetivo,control.tolerancia,control.critico]).then((data) => {
                  //console.debug("INSERT CONTROL: " + control.idusuario + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CONTROL-> " + JSON.stringify(error));
              });
       // });
}

//   saveChecklist(checklist){
//         //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
//                   this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES (?,?,?,?,?)",[checklist.idchecklist,checklist.idusuario,checklist.nombrechecklist,checklist.id,checklist.nombre]).then((data) => {
//                   console.debug("335->INSERT CHECKLIST", moment(this.Momento).diff(moment(), 'seconds'));
//               }, (error) => {
//                   console.debug("ERROR SAVING CHECKLIST -> " + JSON.stringify(error));
//               });
//        // });
// }

  saveChecklimpieza(checklimpieza){
        //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
                  this.sql.executeSql("INSERT INTO checklimpieza ( idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[checklimpieza.idlimpiezazona,checklimpieza.idusuario,checklimpieza.nombrelimpieza,checklimpieza.id,checklimpieza.nombre,checklimpieza.fecha,checklimpieza.tipo,checklimpieza.periodicidad,checklimpieza.productos,checklimpieza.protocolo,checklimpieza.responsable]).then((data) => {
                  //console.debug("INSERT CHECKLIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
                  this.sql.executeSql("DELETE from resultadoslimpieza WHERE id > 0",[]).then((data) => {
                  console.debug("BORRANDO RESULTADOS LIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
      //  });
}
saveLimpiezaRealizada(limpiezaRealizada){
       // this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {  
          console.debug("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor)) VALUES (?,?,?,?,?,?)",limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor);              
                  this.sql.executeSql("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision) VALUES (?,?,?,?,?,?,?)",[limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor,limpiezaRealizada.supervision]).then((data) => {
              }, (error) => {
                  console.debug("ERROR SAVING limpiezaRealizada-> " + JSON.stringify(error));
              });
    //    });
}

    getLimpiezasRealizadas() {
console.debug("479->Inicio LimpizasRealizadas", moment(this.Momento).diff(moment(), 'seconds'));
      this.supervisionLimpiezas=[];
      //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("SELECT * FROM supervisionlimpieza WHERE idsupervisor = ?",[sessionStorage.getItem("idusuario")]).then((data) => {
                  for(let i = 0; i < data.rows.length; i++) {
                      this.supervisionLimpiezas.push(new supervisionLimpieza(
                        data.rows.item(i).id,
                        data.rows.item(i).idlimpiezarealizada,
                        data.rows.item(i).idElemento,
                        data.rows.item(i).nombrelimpieza,
                        data.rows.item(i).fecha,
                        data.rows.item(i).tipo,
                        data.rows.item(i).responsable,
                        data.rows.item(i).idsupervisor,
                        null,
                        0,
                        null
                      ));
                    }
                  }, (error) => {
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      //});   
      console.debug("LIMPIEZAS REALIZADAS",  this.supervisionLimpiezas)
console.debug("FIN LimpizadasezasReali", moment(this.Momento).diff(moment(), 'seconds'));
    }

    getControles() {
      console.debug("397->Inicio controles", moment(this.Momento).diff(moment(), 'seconds'));
      let fecha = moment(new Date()).format('YYYY-MM-DD');
      this.controlesList=[];
      //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("SELECT * FROM controles WHERE idusuario = ?  and fecha <= ? ",[sessionStorage.getItem("idusuario"),fecha]).then((data) => {
                  for(let i = 0; i < data.rows.length; i++) {
                    let isBD = moment(new Date(data.rows.item(i).fecha)).isBefore(moment(), 'day');
                      this.controlesList.push({
                      "id": data.rows.item(i).id,
                      "nombre": data.rows.item(i).nombre,
                      "pla": data.rows.item(i).pla,
                      "minimo": data.rows.item(i).minimo,
                      "maximo": data.rows.item(i).maximo,
                      "tolerancia": data.rows.item(i).tolerancia,
                      "critico": data.rows.item(i).critico,
                      "fecha": data.rows.item(i).fecha,
                      "periodicidad": data.rows.item(i).periodicidad,
                      "frecuencia":data.rows.item(i).frecuencia,
                      "isbeforedate":isBD
                      });
                    }
                  }, (error) => {
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      //});   
      console.debug("Fin Controles", moment(this.Momento).diff(moment(), 'seconds'));
    }

takeControl(control)
{
 // alert("go");
 // this.platform.ready().then(() =>{
  this.navCtrl.push(ControlPage, {control}).then(
      response => {
        console.debug('Response ' + response);
      },
      error => {
        console.debug('Error: ' + error);
      }
    ).catch(exception => {
      console.debug('Exception ' + exception);
    });
}



getChecklists(){
  console.debug("439->Inicio Checklist", moment(this.Momento).diff(moment(), 'seconds'));
  let fecha = moment(new Date()).format('YYYY-MM-DD');
  this.checklistList =[];
                 // this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //db2.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario")]).then((data) => {
                  this.sql.executeSql("Select * FROM checklist WHERE idusuario = ? and fecha <= ?  GROUP BY idchecklist", [sessionStorage.getItem("idusuario"),fecha]).then((data) => {                  
                                    
                  //this.checklistList = data.rows;
                  console.debug(data.rows.length);
                  if (data.rows.length > 0 ){
                      for (var index=0;index < data.rows.length;index++){
                        let isBD = moment(new Date(data.rows.item(index).fecha)).isBefore(moment(), 'day');
                        this.checklistList.push(data.rows.item(index));
                        this.checklistList[index]["isbeforedate"] = isBD;
                        console.debug(data.rows.item(index));
                      //   this.checklistList.push({
                      //         "id":  data.rows.item(index).id,
                      //         "idchecklist": data.rows.item(index).idchecklist,
                      //         "nombrechecklist": data.rows.item(index).nombrechecklist,
                      //         "idcontrol":data.rows.item(index).idcontrol,
                      //         "nombrecontrol":data.rows.item(index).nombrecontrol,
                      //         "checked":data.rows.item(index).checked,
                      //         "idusuario": data.rows.item(index).idusuario,
                      //         "descripcion": data.rows.item(index).descripcion,
                      // });
                      //alert (data.res.rows[index].nombrechecklist);
                    }
                     console.debug("464-> FIN Checklist", moment(this.Momento).diff(moment(), 'seconds'));
                  }
                  console.debug ("checklist:", this.checklistList);
              }, (error) => {
                  console.debug("ERROR Checklist-> " + JSON.stringify(error.err));
                  alert("error home Checklist 325 " + JSON.stringify(error.err));
              }); 
              // });
              console.debug("472->FIN Checklist", moment(this.Momento).diff(moment(), 'seconds'));
}

getLimpiezas(){
  console.debug("476->Inicio limpiezas",moment(this.Momento).diff(moment(), 'seconds'));
  
                  let fecha = moment(new Date()).format('YYYY-MM-DD');
                  //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  this.sql.executeSql("Select * FROM checklimpieza WHERE idusuario = ? and fecha <= ?  GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario"),fecha]).then(
                    (data) => {
                      this.checkLimpiezas =[];
                  //console.log('NUM checklimpiezas:',data.rows.length);
                  console.log('***GET LIMPIEZAS');
                      for (let index=0;index < data.rows.length;index++){
                     //   this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idLimpieza,))
                        this.checkLimpiezas.push(data.rows.item(index));
                        //console.log('BUCLE:',index,this.checkLimpiezas);
                    }
                  //console.log ("checkLimpiezas:", this.checkLimpiezas);
              }, (error) => {
                  console.debug("ERROR home Limpizas. 342-> ", error);
                  alert("error home Limpizas. 342" + error);
              }); 
             //});
             console.debug("Fin  Limpizas",new Date());
}

getMantenimientos(){
  console.debug("738->Inicio Mantenimientos",moment(this.Momento).diff(moment(), 'seconds'));
  this.mantenimientos =[];

                  let fecha = moment(new Date()).format('YYYY-MM-DD');
                  let isBD;
                  //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  this.sql.executeSql("Select * FROM maquina_mantenimiento WHERE fecha <= ?  GROUP BY nombreMaquina ORDER BY nombreMaquina, orden", [fecha]).then(
                    (data) => {
                  console.debug('NUMmantenimientos:',data.rows.length);
                      for (let index=0;index < data.rows.length;index++){
                        isBD = moment(new Date(data.rows.item(index).fecha)).isBefore(moment(), 'day');
                     //   this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idLimpieza,))
                        this.mantenimientos.push(data.rows.item(index));
                        this.mantenimientos[index].isbeforedate = isBD;
                    }
                  console.debug ("mantenimientos:", this.mantenimientos);
              }, (error) => {
                  console.debug("ERROR home mantenimientos. 752-> ", error);
                  alert("error home mantenimientos. 752" + error);
              }); 
             //});
             console.debug("Fin  mantenimientoss",new Date());
}
getCalibraciones(){
  console.debug("738->Inicio Calibraciones",moment(this.Momento).diff(moment(), 'seconds'));
  this.calibraciones =[];
                  let fecha = moment(new Date()).format('YYYY-MM-DD');
                  let isBD;
                  //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  this.sql.executeSql("Select * FROM maquina_calibraciones WHERE fecha <= ?  GROUP BY nombreMaquina ORDER BY nombreMaquina, orden", [fecha]).then(
                    (data) => {
                  console.debug('NUMCalibraciones:',data.rows.length);
                      for (var index=0;index < data.rows.length;index++){
                        isBD = moment(new Date(data.rows.item(index).fecha)).isBefore(moment(), 'day');
                     //   this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idLimpieza,))
                        this.calibraciones.push(data.rows.item(index));
                        this.calibraciones[index].isbeforedate = isBD;
                    }
                  console.debug ("Calibraciones:", this.calibraciones);
              }, (error) => {
                  console.debug("ERROR home Calibraciones. 773-> ", error);
                  alert("error home Calibraciones. 774" + error);
              }); 
             //});
             console.debug("Fin  Calibraciones",new Date());
}



takeChecklist(checklist){
this.navCtrl.push(CheckPage,{checklist});
}

takeLimpieza(limpieza){
  console.debug('home',limpieza);
this.navCtrl.push(CheckLimpiezaPage,{limpieza});
}

takeMCorrectivo(){
  console.debug('home',);

this.navCtrl.push(MCorrectivoPage);
}

takeMantenimiento(mantenimiento,entidad){
  console.debug('home',mantenimiento);
this.navCtrl.push(MantenimientoPage,{mantenimiento,entidad});
}

supervisar(){
  this.navCtrl.push(SupervisionPage);
}
  doRefresh(refresher) {
    console.debug('Begin async operation', refresher);
    //this.sincronizate();
    this.callSincroniza();
    setTimeout(() => {
      console.debug('Async operation has ended');
      refresher.complete();
    }, 2000);
  }
  presentLoading() {
    console.debug('##SHOW LOADING HOME');
    this.loader = this.loadingCtrl.create({
      content: "Actualizando...",
     // duration: 3000
    });
    this.loader.present();
    //loader.dismiss();
  }
    closeLoading(){
      console.debug('##HIDE LOADING HOME');
   setTimeout(() => {
      console.debug('Async operation has ended');
      this.loader.dismiss()
    }, 1000);
  }

  checkPeriodo(periodicidad: string): string{
    if (periodicidad){
    let valor:string;
    try{
    let periodo = JSON.parse(periodicidad);
    return periodo.repeticion;
    }catch(e){
      console.debug('**error:',e);
      return 'por uso';
    } 
    }else{
      return 'por uso';
    }
  }

}
