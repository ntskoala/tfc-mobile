import { Component } from '@angular/core';

import { NavController, MenuController } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import {LoginPage} from '../login/login';
import {ControlPage} from '../control/control';
import { CheckPage } from '../check/check';
import {Empresa} from '../empresa/empresa';
import { Sync } from '../../providers/sync';
import { Servidor } from '../../providers/servidor';
import { Initdb } from '../../providers/initdb'

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { URLS } from '../../models/models'


export class controlesList {
  id: number;
  nombre: string;
  pla: string;
  minimo: number;
  maximo: number;
  tolerancia: number;
  critico: number;
}
export class checklistList {
  id: number;
  idchecklist: number;
  nombrechecklist: string;
  idcontrol:number;
  nombrecontrol:string;
  checked:boolean;
  idusuario: string;
  descripcion: string;
}



@Component({
  selector: 'page-home',
  templateUrl: 'home.html'

})
export class HomePage {
miscontroles: any;
mischecks: any;
public cambio: number;
accesomenu: any;
public logoempresa;
public empresa =0;
public controlesList: controlesList[] =[];
public checklistList: checklistList[] = [];


  constructor(public navCtrl: NavController, menu: MenuController, private data:Initdb, private sync: Sync,private servidor: Servidor, public db :SQLite,public network:Network) {
  
       if (localStorage.getItem("inicializado") === null){
          if (this.network.type != 'none') {
          localStorage.getItem("idempresa") === null ? console.log("no hay idempresa"): this.sincronizate();
          }else{
            alert ('No hay conexión, para sincronizar los datos');
          }
      } else{
          this.hayUpdates().then(
            (versionActual)=>{
           console.log("versionActual Controles",versionActual);
          if (versionActual > parseInt(localStorage.getItem("versioncontrols"))){ 
            this.sincronizate(versionActual.toString());
          }else{
            this.getControles();
            this.getChecklists();
          }
            });
      }
            
            


   console.log("constructor homePage_data.logged:",this.data.logged);
         
        let login = this.data.logged;
        console.log("login =", login);
        if ((login === undefined || login == null)) {
          if (!localStorage.getItem("intro")) {
            if (!sessionStorage.getItem("introvista"))
            { 
            this.navCtrl.setRoot(LoginPage);
          }
            else
            { this.navCtrl.setRoot(LoginPage); }
          }
        }
        else {
        }
        this.refreshlogo();
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
          resolve(updates);
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


refreshlogo(){
  this.empresa = parseInt(localStorage.getItem("idempresa"));
this.logoempresa = "https://tfc.proacciona.es/logos/"+localStorage.getItem("idempresa")+"/logo.jpg";
}
sincronizate(version? : string){
  console.log("sincronizando...");
 //CONTROLES
   //CONTROLES
   // DESCARGA CONTROLES ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            
            this.sync.getMisControles(this.data.logged).subscribe(
            data => {
              //test
              this.miscontroles = JSON.parse(data.json());
              console.log('resultado' + this.miscontroles.success);
              console.log('success: ' +this.miscontroles.data[0].nombre);
              if (this.miscontroles.success){
              //test
               this.miscontroles = this.miscontroles.data;
                this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("delete from controles",[]).then((data) => {
                      console.log(JSON.stringify(data.res));
                      this.miscontroles.forEach (control => this.saveControl(control));
                      }, (error) => {
                      console.log("ERROR -> " + JSON.stringify(error));
                      //alert("Error 1");
                    } );
                });
               //this.miscontroles.forEach (control => this.saveControl(control));
              }
            },
            err => console.error(err),
            () => this.getControles()

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
                    console.log("mischecklists: " + this.mischecks);
                   this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                    db2.executeSql("delete from checklist",[]).then((data) => {
                      this.mischecks.forEach (checklist => this.saveChecklist(checklist));
                      console.log(JSON.stringify(data.res));
                      }, (error) => {
                      console.log("ERROR -> " + JSON.stringify(error));
                      //alert("Error 2");
                    } );
                });
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

}

  saveControl(control){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {                
                  db2.executeSql("INSERT INTO controles (id,idusuario, nombre, pla, minimo, maximo, objetivo, tolerancia, critico) VALUES (?,?,?,?,?,?,?,?,?)",[control.id,control.idusuario,control.nombre,control.pla,control.valorminimo,control.valormaximo,control.objetivo,control.tolerancia,control.critico]).then((data) => {
                  console.log("INSERT CONTROL: " + control.idusuario + JSON.stringify(data));
              }, (error) => {
                  console.log("ERROR SAVING CONTROL-> " + JSON.stringify(error));
              });
        });
}

  saveChecklist(checklist){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {            
                  db2.executeSql("INSERT INTO checklist (idchecklist,idusuario, nombrechecklist, idcontrol, nombrecontrol) VALUES (?,?,?,?,?)",[checklist.idchecklist,checklist.idusuario,checklist.nombrechecklist,checklist.id,checklist.nombre]).then((data) => {
                  console.log("INSERT CHECKLIST" + checklist.nombrechecklist + JSON.stringify(data));
              }, (error) => {
                  console.log("ERROR SAVING CHECKLIST -> " + JSON.stringify(error));
              });
        });
}




// cambioempresa()
// {
//   this.cambio +=1;
//   console.log(this.cambio);
//   if (this.cambio >=10){
//     this.navCtrl.setRoot(Empresa);
//   }
// }






    getControles() {
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
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error " + JSON.stringify(error.err));
                });  
      });   
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
 
 
 
 // });
}



getChecklists(){
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("Select * FROM checklist WHERE idusuario = ? GROUP BY idchecklist", [sessionStorage.getItem("idusuario")]).then((data) => {
                  //this.checklistList = data.rows;
                  console.log(data.rows.length);
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
                  console.log ("checklist:" + this.checklistList);
              }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error " + JSON.stringify(error.err));
              }); 
                  });
}

takeChecklist(checklist){
this.navCtrl.push(CheckPage,{checklist});
}


  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    this.sincronizate();
    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }
}
