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
import { SupervisionPage } from '../supervision/supervision';
import {Empresa} from '../empresa/empresa';
import { Sync } from '../../providers/sync';
import { Servidor } from '../../providers/servidor';
import { Initdb } from '../../providers/initdb'

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { URLS, controlesList, checklistList, checkLimpieza, limpiezaRealizada,supervisionLimpieza } from '../../models/models'
import * as moment from 'moment';





@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [SyncPage]

})
export class HomePage {
miscontroles: any;
mischecks: any;
mischeckslimpiezas: any;
mislimpiezasrealizadas: any;
public cambio: number;
accesomenu: any;
public logoempresa;
public empresa =0;
public controlesList: controlesList[] =[];
public checklistList: checklistList[] = [];
public checkLimpiezas: checkLimpieza[] = [];
public supervisionLimpiezas: supervisionLimpieza[] = [];
public loader:any;
public status:boolean[]=[false,false,false,false];
public sql: SQLiteObject;
public Momento;

  constructor(public navCtrl: NavController, menu: MenuController, private data:Initdb, private sync: Sync,public syncPage: SyncPage,private servidor: Servidor, public db :SQLite,public network:Network,public loadingCtrl: LoadingController, public params: NavParams) {
    this.network.onDisconnect().subscribe(
      estado=>{
        console.log(estado.timeStamp - this.data.momentoCambioEstado);
          this.data.momentoCambioEstado = estado.timeStamp;
        this.data.hayConexion = false;
      }
    );
    this.network.onConnect().subscribe(
        estado=>{
          console.log(estado.timeStamp - this.data.momentoCambioEstado);
          this.data.momentoCambioEstado = estado.timeStamp;
           console.log ('lestado conexion',this.data.hayConexion);
          if (!this.data.hayConexion){
          this.data.hayConexion = true;
          
          let badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));
          if (badge > 0){
          let rndTime = Math.random()*500;
          console.log ('la conexion ha vuelto',estado);
          setTimeout(
            ()=>this.syncData(),
            rndTime
          )
          }
        }
        }
      );
    let login = this.data.logged;
        if ((login === undefined || login == null)) {
          this.navCtrl.setRoot(LoginPage);
        } else {
          this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            this.sql = db2;
          
          if (this.network.type != 'none') {
            if (localStorage.getItem("versioncontrols") === null) {
              this.callSincroniza();
            } else {
              this.hayUpdates().then(
                (versionActual) => {
                  console.log("versionActual Controles", versionActual);
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


syncData(){
        console.log ('a sincronizar');
            this.syncPage.sync_data();
}



callSincroniza(versionActual?){
  this.Momento = moment();
  console.log("Inicio callSincroniza",this.Momento.format("mm:ss"));
              this.presentLoading();
              if (versionActual) versionActual = versionActual.toString();
              this.sincronizate(versionActual).subscribe(
              (valor)=>{
                console.log("1", valor);
                switch(valor){
                  case "controles":
                    this.status[0] = true;
                    break;
                  case "checklists":
                  this.status[1] = true;
                  break;
                  case "limpiezas":
                  this.status[2] = true;
                  break
                  case "limpiezasRealizadas":
                  this.status[3] = true;
                  break
                }
                console.log(this.status, moment(this.Momento).diff(moment(), 'seconds'));
                if (this.status[0] && this.status[1] && this.status[2] && this.status[3]){
                 console.log("STATUS 4", moment(this.Momento).diff(moment(), 'seconds'));

                  if (!(versionActual>0)) localStorage.setItem("versioncontrols","0");
                  setTimeout(()=>{ 
                    this.cargaListas();
                    this.status=[false,false,false,false];
            this.closeLoading();
            },1500);
                }
              },
              (error)=>console.log(error)
            );
}

cargaListas(){
  console.log("Inicio CargaListas", moment(this.Momento).diff(moment(), 'seconds'));
            this.getControles();
            this.getChecklists();
            this.getLimpiezas();
            this.getLimpiezasRealizadas();  
  console.log("Fin CargaListas", moment(this.Momento).diff(moment(), 'seconds')); 
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
            }
        },
        (error)=>{
          console.log(error)
          resolve('Error en hay updates() home# 161' + updates);
      },
        ()=>{
            resolve(updates);
        });
    });
        //return updates;
   }


ionViewDidLoad(){
  this.cambio=0;

}
ionViewDidEnter(){
  console.log("didEnter...");
  // if (this.params.get('origen')== 'checkLimpiezas'){
  //   alert('from limpiezas' + + this.params.get('limpieza') + this.params.get('eliminar'))
  // }
  
}

refreshlogo(){
  this.empresa = parseInt(localStorage.getItem("idempresa"));
this.logoempresa = URLS.SERVER + "logos/"+localStorage.getItem("idempresa")+"/logo.jpg";

}
sincronizate(version? : string){
  console.log("sincronizando...");
 //CONTROLES
   //CONTROLES
   // DESCARGA CONTROLES ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
    return new Observable((response)=> {     
            this.sync.getMisControles(this.data.logged).subscribe(
            data => {
              //test
              this.miscontroles = JSON.parse(data.json());
              console.log('resultado' + this.miscontroles.success);
              //console.log('success: ' +this.miscontroles.data[0].nombre);
              if (this.miscontroles.success){
              //test
               this.miscontroles = this.miscontroles.data;
               if (this.miscontroles){
                //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("delete from controles",[]).then((data) => {
                      //console.log(JSON.stringify(data.res));
                      let argumentos=[];
                      let valores='';
                      this.miscontroles.forEach (control => {
                        //this.saveControl(control)
                       argumentos.push ('(?,?,?,?,?,?,?,?,?)');
                       valores += "("+control.id+","+control.idusuario+",'"+control.nombre+"','"+control.pla+"',"+control.valorminimo+","+control.valormaximo+","+control.objetivo+","+control.tolerancia+","+control.critico+"),";           
                      });
                      valores = valores.substr(0,valores.length-1);
                      let query = "INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico) VALUES" + valores;
                      console.log('########',query);

                      this.sql.executeSql("INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico) VALUES" + valores ,[])
                      .then((data) => {
                        console.log('***********OK INSERT CONTROLES', data)
                      },
                      (error)=>{ console.log('***********ERROR', error)});

                      }, (error) => {
                      console.log("ERROR -> " + JSON.stringify(error));
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
                    console.log('resultado check: ' + this.mischecks.success);
                //    console.log('success check: ' +this.mischecks.data[0].nombre);
                if (this.mischecks.success){
                  console.log ("if");
                  //test
                    this.mischecks = this.mischecks.data;
                    if (this.mischecks){
                    console.log("mischecklists: " + this.mischecks);
                   //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    this.sql.executeSql("delete from checklist",[]).then((data) => {
                      console.log("total chacklists:",this.mischecks.length);
                      let argumentos=[];
                      let valores='';
                      this.mischecks.forEach (checklist => {
                       // this.saveChecklist(checklist)
                       argumentos.push ('(?,?,?,?,?)');
                        valores += "("+checklist.idchecklist+","+checklist.idusuario+",'"+checklist.nombrechecklist+"',"+checklist.id+",'"+checklist.nombre+"'),";
                       //valores.push([fila]);
                      });
                      valores = valores.substr(0,valores.length-1);
                      let query = "INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES " + valores;
                      console.log('########',query);
                      this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES " + valores ,[])
                      .then((data) => {
                        console.log('***********OK INSERT CHECKLIST', data)
                      },
                      (error)=>{ console.log('***********ERROR', error)});
                         
                  //this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES ("+checklist+")").then((data) => {console.log('*****************FIN')});

                      console.log(JSON.stringify(data.res));
                      }, (error) => {
                      console.log("ERROR -> " + JSON.stringify(error));
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
                    console.log('resultado checklimpieza: ' + this.mischeckslimpiezas.success);
                //    console.log('success check: ' +this.mischecks.data[0].nombre);
                if (this.mischeckslimpiezas.success){
                  console.log ("if");
                  //test
                    this.mischeckslimpiezas = this.mischeckslimpiezas.data;
                    if (this.mischeckslimpiezas){
                    console.log("mischecklistslimpiezaas: " + this.mischeckslimpiezas);
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
                      console.log('########',query);

                      this.sql.executeSql(query,[])
                      .then((data) => {
                        console.log('***********OK INSERT LIMPIEZASREALIZADAS', data)
                      },
                      (error)=>{ console.log('***********ERROR', error)});
                      console.log(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.log("ERROR home. 211 delete mislimpiezas-> " + JSON.stringify(error));
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

 //LIMPIEZAS REALIZADAS
   //LIMPIEZAS REALIZADAS
   // DESCARGA LIMPIEZAS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.

            this.sync.getMisLimpiezasRealizadas(this.data.logged).map(res => res.json()).subscribe(
            data => {
               this.mislimpiezasrealizadas = JSON.parse(data);
                    console.log('resultado limpiezasRealizadas: ' + this.mislimpiezasrealizadas.success);
                //    console.log('success check: ' +this.mischecks.data[0].nombre);
                if (this.mislimpiezasrealizadas.success){
                  console.log ("if LIMPIEZAS REALIZADAS.SUCEESS");
                  //test
                    this.mislimpiezasrealizadas = this.mislimpiezasrealizadas.data;
                    if (this.mislimpiezasrealizadas){
                    console.log("mislimpiezasrealizadas: " + this.mislimpiezasrealizadas);
                   //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    this.sql.executeSql("delete from supervisionlimpieza",[]).then((data) => {
                      let argumentos=[];
                      let valores='';
                      this.mislimpiezasrealizadas.forEach (limpiezaRealizada => {
                      //  this.saveLimpiezaRealizada(limpiezarealizada)

                       argumentos.push ('(?,?,?,?,?,?,?)');
                       valores += "("+limpiezaRealizada.id+",'"+limpiezaRealizada.nombre+"','"+limpiezaRealizada.fecha+"','"+limpiezaRealizada.tipo+"','"+limpiezaRealizada.responsable+"',"+limpiezaRealizada.supervisor+","+limpiezaRealizada.supervision+"),";           
                      });
                      valores = valores.substr(0,valores.length-1);
                      let query = "INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision) VALUES " + valores;
                      console.log('########',query);

                      this.sql.executeSql(query,[])
                      .then((data) => {
                        console.log('***********OK INSERT LIMPIEZASREALIZADAS', data)
                      },
                      (error)=>{ console.log('***********ERROR', error)});
                      console.log(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.log("ERROR home. 211 delete limpiezas Realizadas-> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                //});
                    }
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
                  //console.log("INSERT CONTROL: " + control.idusuario + JSON.stringify(data));
              }, (error) => {
                  console.log("ERROR SAVING CONTROL-> " + JSON.stringify(error));
              });
       // });
}

//   saveChecklist(checklist){
//         //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
//                   this.sql.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES (?,?,?,?,?)",[checklist.idchecklist,checklist.idusuario,checklist.nombrechecklist,checklist.id,checklist.nombre]).then((data) => {
//                   console.log("335->INSERT CHECKLIST", moment(this.Momento).diff(moment(), 'seconds'));
//               }, (error) => {
//                   console.log("ERROR SAVING CHECKLIST -> " + JSON.stringify(error));
//               });
//        // });
// }

  saveChecklimpieza(checklimpieza){
        //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
                  this.sql.executeSql("INSERT INTO checklimpieza ( idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[checklimpieza.idlimpiezazona,checklimpieza.idusuario,checklimpieza.nombrelimpieza,checklimpieza.id,checklimpieza.nombre,checklimpieza.fecha,checklimpieza.tipo,checklimpieza.periodicidad,checklimpieza.productos,checklimpieza.protocolo,checklimpieza.responsable]).then((data) => {
                  //console.log("INSERT CHECKLIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.log("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
                  this.sql.executeSql("DELETE from resultadoslimpieza WHERE id > 0",[]).then((data) => {
                  console.log("BORRANDO RESULTADOS LIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.log("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
      //  });
}
saveLimpiezaRealizada(limpiezaRealizada){
       // this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {  
          console.log("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor)) VALUES (?,?,?,?,?,?)",limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor);              
                  this.sql.executeSql("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision) VALUES (?,?,?,?,?,?,?)",[limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor,limpiezaRealizada.supervision]).then((data) => {
              }, (error) => {
                  console.log("ERROR SAVING limpiezaRealizada-> " + JSON.stringify(error));
              });
    //    });
}

    getLimpiezasRealizadas() {
console.log("369->Inicio LimpizadasezasReali", moment(this.Momento).diff(moment(), 'seconds'));
      this.supervisionLimpiezas=[];
      //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("SELECT * FROM supervisionlimpieza WHERE idsupervisor = ?",[sessionStorage.getItem("idusuario")]).then((data) => {
                  for(let i = 0; i < data.rows.length; i++) {
                      this.supervisionLimpiezas.push(new supervisionLimpieza(
                        data.rows.item(i).id,
                        data.rows.item(i).idlimpiezarealizada,
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
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      //});   
      console.log("LIMPIEZAS REALIZADAS",  this.supervisionLimpiezas)
console.log("FIN LimpizadasezasReali", moment(this.Momento).diff(moment(), 'seconds'));
    }

    getControles() {
      console.log("397->Inicio controles", moment(this.Momento).diff(moment(), 'seconds'));
      this.controlesList=[];
      //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  this.sql.executeSql("SELECT * FROM controles WHERE idusuario = ?",[sessionStorage.getItem("idusuario")]).then((data) => {
                  for(let i = 0; i < data.rows.length; i++) {
                      this.controlesList.push({
                      "id": data.rows.item(i).id,
                      "nombre": data.rows.item(i).nombre,
                      "pla": data.rows.item(i).pla,
                      "minimo": data.rows.item(i).minimo,
                      "maximo": data.rows.item(i).maximo,
                      "tolerancia": data.rows.item(i).tolerancia,
                      "critico": data.rows.item(i).critico,
                      });
                    }
                  }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      //});   
      console.log("Fin Controles", moment(this.Momento).diff(moment(), 'seconds'));
    }

takeControl(control)
{
 // alert("go");
 // this.platform.ready().then(() =>{
  this.navCtrl.push(ControlPage, {control}).then(
      response => {
        console.log('Response ' + response);
      },
      error => {
        console.log('Error: ' + error);
      }
    ).catch(exception => {
      console.log('Exception ' + exception);
    });
}



getChecklists(){
  console.log("439->Inicio Checklist", moment(this.Momento).diff(moment(), 'seconds'));
  this.checklistList =[];
                 // this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //db2.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario")]).then((data) => {
                  this.sql.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idchecklist", [sessionStorage.getItem("idusuario")]).then((data) => {                  
                                    
                  //this.checklistList = data.rows;
                  console.log(data.rows.length);
                  if (data.rows.length > 0 ){
                      for (var index=0;index < data.rows.length;index++){
                        this.checklistList.push(data.rows.item(index));
                        
                        console.log(data.rows.item(index));
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
                     console.log("464-> FIN Checklist", moment(this.Momento).diff(moment(), 'seconds'));
                  }
                  console.log ("checklist:", this.checklistList);
              }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 325 " + JSON.stringify(error.err));
              }); 
              // });
              console.log("472->FIN Checklist", moment(this.Momento).diff(moment(), 'seconds'));
}

getLimpiezas(){
  console.log("476->Inicio limpiezas",moment(this.Momento).diff(moment(), 'seconds'));
  this.checkLimpiezas =[];
                  let fecha = moment(new Date()).format('YYYY-MM-DD');
                  //this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  this.sql.executeSql("Select * FROM checklimpieza WHERE idusuario = ? and fecha <= ?  GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario"),fecha]).then(
                    (data) => {
                  
                  console.log(data.rows.length);
                      for (var index=0;index < data.rows.length;index++){
                     //   this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idLimpieza,))
                        this.checkLimpiezas.push(data.rows.item(index));
                    }
                  console.log ("checkLimpiezas:", this.checkLimpiezas);
              }, (error) => {
                  console.log("ERROR home. 342-> ", error);
                  alert("error home. 342" + error);
              }); 
             //});
             console.log("Fin  Limpizas",new Date());
}

takeChecklist(checklist){
this.navCtrl.push(CheckPage,{checklist});
}

takeLimpieza(limpieza){
  console.log('home',limpieza);
this.navCtrl.push(CheckLimpiezaPage,{limpieza});
}
supervisar(){
  this.navCtrl.push(SupervisionPage);
}
  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    //this.sincronizate();
    this.callSincroniza();
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }
  presentLoading() {
    console.log('##SHOW LOADING HOME');
    this.loader = this.loadingCtrl.create({
      content: "Actualizando...",
     // duration: 3000
    });
    this.loader.present();
    //loader.dismiss();
  }
    closeLoading(){
      console.log('##HIDE LOADING HOME');
   setTimeout(() => {
      console.log('Async operation has ended');
      this.loader.dismiss()
    }, 1000);
  }
}
