import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Network } from '@ionic-native/network';
import { Sync } from '../../providers/sync';
import { Initdb } from '../../providers/initdb';

import { MyApp } from '../../app/app.component';


@Component({
  selector: 'page-sync',
  templateUrl: 'sync.html'
})
export class SyncPage {
public users: any;
//public db: SQLite;
//public db2: SQLite;
public conexion: boolean = false;
public badge: number;
//public myapp:MyApp;
  constructor(public navCtrl: NavController, public initdb: Initdb, public sync: Sync, public translate: TranslateService,public db :SQLite,public network:Network) {
        if (this.network.type != 'none') {
          console.log("conected");
      }
      this.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));


  }
alerta(text){
alert(text);
}

  ionViewDidLoad() {
    console.log('Hello Sync Page');
  }

  sync_data() {
    if (this.network.type != 'none') {
      this.sync_data_control();
      this.sync_data_checklist();
    }
    else {
      
      this.translate.get("alertas.conexion").subscribe(resultado => alert(resultado));
      
    }
  }

sync_data_control(){
  //alert("hay sinc");
      //this.db2 = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            console.log("base de datos abierta 1");

            
                db2.executeSql("select idcontrol,resultado,fecha,foto, idusuario from resultadoscontrol",[]).then((data) => {
                  console.log("executed sql" + data.rows.length);
                  if (data.rows.length > 0){
                        let arrayfila =[];
                        for (let fila = 0; fila < data.rows.length;fila++)
                        {
                              console.log (data.rows.item(fila));
                              
                              arrayfila.push(data.rows.item(fila))
                        }

                  this.sync.setResultados(JSON.stringify(arrayfila),"resultadoscontrol")
                  .subscribe(data => {console.log("control5")
                                      localStorage.setItem("synccontrol","0");
                                      this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));
                                      this.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));
                                      },
                              error => console.log("control6" + error),
                              () => console.log("ok"));
                  }
              }, (error) => {
                  console.log(error);
                  alert("error, no se han podido sincronizar todos los datos [resultadoscontroles] " + error.message);
              });
            
          }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
  });

}

sync_data_checklist(){

      //this.db = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            console.log("base de datos abierta");


                db2.executeSql("select idlocal,idchecklist,fecha,foto, idusuario from resultadoschecklist",[]).then((data) => {
                  if (data.rows.length > 0){
                   
                    for (let fila = 0; fila < data.rows.length;fila++)
                        {
                          console.log (data.rows.item(fila));
                          let idlocal = data.rows.item(fila).idlocal;
                          let arrayfila =[data.rows.item(fila)];
                          arrayfila.push()
                        let idrespuesta = this.sync.setResultados(JSON.stringify(arrayfila),"resultadoschecklist")
                        .subscribe(data => this.sync_checklistcontroles(data.id, idlocal ));
                        console.log ("returned" + idrespuesta);
                        }
                        localStorage.setItem("syncchecklist","0");
                        this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));
                        this.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));
                }
              }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error, no se han podido sincronizar todos los datos [resultadoschecklist]" + JSON.stringify(error.err));
              });

          }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
  });


}

sync_checklistcontroles(id, idlocal){
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
            console.log("base de datos abierta");

 console.log ("send: " + id + " idlocal= " + idlocal);
                db2.executeSql("select idcontrolchecklist,  " +  id + " as idresultadochecklist ,resultado,descripcion,fotocontrol from resultadoscontroleschecklist WHERE idresultadochecklist = ?",[idlocal]).then((data) => {
                  console.log (data.rows.length);
                  if (data.rows.length > 0){
                        let arrayfila =[];
                        for (let fila = 0; fila < data.rows.length;fila++)
                        {
                              console.log (data.rows.item(fila));
                              
                              arrayfila.push(data.rows.item(fila))
                        } 
                  this.sync.setResultados(JSON.stringify(arrayfila),"resultadoscontroleschecklist")
                    .subscribe(data => {console.log("control3")},
                              error => console.log("control4" + error),
                              () => console.log("fin"));
                  }
            }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error, no se han podido sincronizar todos los datos [resultadoscontrolchecklist]" + JSON.stringify(error.err));
              });
}, (error) => {
      console.log("ERROR al abrir la bd: ", error);
  });

}



}
