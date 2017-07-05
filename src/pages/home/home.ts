import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NavController, MenuController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import {LoginPage} from '../login/login';
import {ControlPage} from '../control/control';
import { CheckPage } from '../check/check';
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
  templateUrl: 'home.html'

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
  constructor(public navCtrl: NavController, menu: MenuController, private data:Initdb, private sync: Sync,private servidor: Servidor, public db :SQLite,public network:Network,public loadingCtrl: LoadingController) {
        let login = this.data.logged;
        if ((login === undefined || login == null)) {
          this.navCtrl.setRoot(LoginPage);
        } else {
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
        }
}

callSincroniza(versionActual?){
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
                  break
                  case "limpiezasRealizadas":
                  this.status[3] = true;
                  break
                }
                console.debug(this.status);
                if (this.status[0] && this.status[1] && this.status[2] && this.status[3]){
                  console.debug('#####ok');
                  if (!(versionActual>0)) localStorage.setItem("versioncontrols","0");
                  setTimeout(()=>{
                    this.cargaListas();
                    this.status=[false,false,false,false];
            this.closeLoading();
            },1500);
                }
              },
              (error)=>console.debug(error)
            );
}

cargaListas(){
            this.getControles();
            this.getChecklists();
            this.getLimpiezas();
            this.getLimpiezasRealizadas();   
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
          console.debug(error)
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
  console.debug("didEnter...");

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
                this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("delete from controles",[]).then((data) => {
                      console.debug(JSON.stringify(data.res));
                      this.miscontroles.forEach (control => this.saveControl(control));
                      }, (error) => {
                      console.debug("ERROR -> " + JSON.stringify(error));
                      //alert("Error 1");
                    } );

                });
               }
                response.next('controles');
               //this.miscontroles.forEach (control => this.saveControl(control));
              }
            },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              this.getControles();
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
                   this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    db2.executeSql("delete from checklist",[]).then((data) => {
                      this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                      console.debug(JSON.stringify(data.res));
                      }, (error) => {
                      console.debug("ERROR -> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                });
                    }
                response.next('checklists');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              this.getChecklists();
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
                   this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    db2.executeSql("delete from checklimpieza",[]).then((data) => {
                      this.mischeckslimpiezas.forEach (checklimpieza => this.saveChecklimpieza(checklimpieza));
                      console.debug(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.debug("ERROR home. 211 delete mislimpiezas-> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                });
                    }
                  response.next('limpiezas');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              this.getChecklists();
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
                    console.debug('resultado limpiezasRealizadas: ' + this.mislimpiezasrealizadas.success);
                //    console.debug('success check: ' +this.mischecks.data[0].nombre);
                if (this.mislimpiezasrealizadas.success){
                  console.debug ("if LIMPIEZAS REALIZADAS.SUCEESS");
                  //test
                    this.mislimpiezasrealizadas = this.mislimpiezasrealizadas.data;
                    if (this.mislimpiezasrealizadas){
                    console.debug("mislimpiezasrealizadas: " + this.mislimpiezasrealizadas);
                   this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    db2.executeSql("delete from supervisionlimpieza",[]).then((data) => {
                      this.mislimpiezasrealizadas.forEach (limpiezarealizada => this.saveLimpiezaRealizada(limpiezarealizada));
                      console.debug(JSON.stringify('deleted limpiezas: ',data.res));
                      }, (error) => {
                      console.debug("ERROR home. 211 delete limpiezas Realizadas-> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                });
                    }
                  response.next('limpiezasRealizadas');
                      //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                  }
              },
            err => console.error(err),
            () => {
              if (version) localStorage.setItem("versioncontrols",version);
              this.getChecklists();
            }
        );  
        //LIMPIEZAS REALIZADAS
        //LIMPIEZAS REALIZADAS
    });
}

  saveControl(control){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {                
                  db2.executeSql("INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico) VALUES (?,?,?,?,?,?,?,?,?)",[control.id,control.idusuario,control.nombre,control.pla,control.valorminimo,control.valormaximo,control.objetivo,control.tolerancia,control.critico]).then((data) => {
                  //console.debug("INSERT CONTROL: " + control.idusuario + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CONTROL-> " + JSON.stringify(error));
              });
        });
}

  saveChecklist(checklist){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
                  db2.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES (?,?,?,?,?)",[checklist.idchecklist,checklist.idusuario,checklist.nombrechecklist,checklist.id,checklist.nombre]).then((data) => {
                  //console.debug("INSERT CHECKLIST" + checklist.nombrechecklist + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CHECKLIST -> " + JSON.stringify(error));
              });
        });
}

  saveChecklimpieza(checklimpieza){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
                  db2.executeSql("INSERT INTO checklimpieza ( idlimpiezazona,idusuario, nombrelimpieza, idelemento, nombreelementol, fecha, tipo, periodicidad ,productos,protocolo,responsable ) VALUES (?,?,?,?,?,?,?,?,?,?,?)",[checklimpieza.idlimpiezazona,checklimpieza.idusuario,checklimpieza.nombrelimpieza,checklimpieza.id,checklimpieza.nombre,checklimpieza.fecha,checklimpieza.tipo,checklimpieza.periodicidad,checklimpieza.productos,checklimpieza.protocolo,checklimpieza.responsable]).then((data) => {
                  //console.debug("INSERT CHECKLIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
                  db2.executeSql("DELETE from resultadoslimpieza WHERE id > 0",[]).then((data) => {
                  console.debug("BORRANDO RESULTADOS LIMNPIEZA" + checklimpieza.nombrelimpieza + JSON.stringify(data));
              }, (error) => {
                  console.debug("ERROR SAVING CHECKLIMPIEZA -> " + JSON.stringify(error));
              });
//****EXCEPTION */
        });
}
saveLimpiezaRealizada(limpiezaRealizada){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {  
          console.debug("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor)) VALUES (?,?,?,?,?,?)",limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor);              
                  db2.executeSql("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision) VALUES (?,?,?,?,?,?,?)",[limpiezaRealizada.id,limpiezaRealizada.nombre,limpiezaRealizada.fecha,limpiezaRealizada.tipo,limpiezaRealizada.responsable,limpiezaRealizada.supervisor,limpiezaRealizada.supervision]).then((data) => {
              }, (error) => {
                  console.debug("ERROR SAVING limpiezaRealizada-> " + JSON.stringify(error));
              });
        });
}

    getLimpiezasRealizadas() {

      this.supervisionLimpiezas=[];
      this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("SELECT * FROM supervisionlimpieza WHERE idsupervisor = ?",[sessionStorage.getItem("idusuario")]).then((data) => {
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
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      });   
      console.debug("LIMPIEZAS REALIZADAS",  this.supervisionLimpiezas)
    }

    getControles() {
      this.controlesList=[];
      this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("SELECT * FROM controles WHERE idusuario = ?",[sessionStorage.getItem("idusuario")]).then((data) => {
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
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 276" + JSON.stringify(error.err));
                });  
      });   
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
  this.checklistList =[];
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //db2.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario")]).then((data) => {
                  db2.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idchecklist", [sessionStorage.getItem("idusuario")]).then((data) => {                  
                                    
                  //this.checklistList = data.rows;
                  console.debug(data.rows.length);
                  if (data.rows.length > 0 ){
                      for (var index=0;index < data.rows.length;index++){
                        this.checklistList.push(data.rows.item(index));
                        
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
                  }
                  console.debug ("checklist:", this.checklistList);
              }, (error) => {
                  console.debug("ERROR -> " + JSON.stringify(error.err));
                  alert("error home 325 " + JSON.stringify(error.err));
              }); 
                  });
}

getLimpiezas(){
  this.checkLimpiezas =[];
                  let fecha = moment(new Date()).format('YYYY-MM-DD');
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  //this.checklistList = data.rows;
                  db2.executeSql("Select * FROM checklimpieza WHERE idusuario = ? and fecha <= ?  GROUP BY idlimpiezazona", [sessionStorage.getItem("idusuario"),fecha]).then(
                    (data) => {
                  
                  console.debug(data.rows.length);
                      for (var index=0;index < data.rows.length;index++){
                     //   this.checkLimpiezas.push(new checkLimpieza(data.rows.item(index).id,data.rows.item(index).idLimpieza,))
                        this.checkLimpiezas.push(data.rows.item(index));
                    }
                  console.debug ("checkLimpiezas:", this.checkLimpiezas);
              }, (error) => {
                  console.debug("ERROR home. 342-> ", error);
                  alert("error home. 342" + error);
              }); 
                  });
}

takeChecklist(checklist){
this.navCtrl.push(CheckPage,{checklist});
}

takeLimpieza(limpieza){
  console.debug('home',limpieza);
this.navCtrl.push(CheckLimpiezaPage,{limpieza});
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
}
