import { Component } from '@angular/core';
import { NavController, NavParams, AlertController,ActionSheetController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate';
//import {Sync} from '../../providers/sync';

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Camera } from '@ionic-native/camera';
import {SyncPage} from '../sync/sync';
import { Initdb } from '../../providers/initdb';

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
//public myapp: MyApp;
//public db: SQLite;
//public fotositems: string[] =[];
  constructor(public navCtrl: NavController, private params: NavParams, private alertCtrl: AlertController, public actionSheetCtrl: ActionSheetController, public initdb: Initdb, public sync: SyncPage, private translate: TranslateService,public db :SQLite, public camera: Camera,public network:Network) {
    
        this.idchecklist =  this.params.get('checklist').idchecklist;
        this.nombrechecklist = this.params.get('checklist').nombrechecklist;
        
        //this.db = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then(() => {
            //this.refresh();
            this.getChecklists(this.idchecklist);
            console.log("base de datos abierta");
        }, (error) => {
            console.log("ERROR al abrir la bd: ", error);
        });
  }

  ionViewDidLoad() {
    console.log('Hello Check Page');
  }
getChecklists(idchecklist){
                  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                  db2.executeSql("Select * FROM checklist WHERE idchecklist = ? and idusuario = ?",[idchecklist, sessionStorage.getItem("idusuario")]).then((data) => {
                  console.log ("resultado1" + data.rows.length);
                  
                  
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
                  //console.log (this.checklistcontroles);
              }, (error) => {
                  console.log("ERROR -> " + JSON.stringify(error.err));
                  alert("error " + JSON.stringify(error.err));
              }); 
                  });

}


terminar(){
  console.log(this.checklistcontroles);
  this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql('INSERT INTO resultadoschecklist (idchecklist, foto,idusuario) VALUES (?,?,?)',[this.idchecklist,this.base64Image,sessionStorage.getItem("idusuario")]).then(
  (Resultado) => { 
          // console.log("resultado: " + Resultado.res.insertId);
           console.log("resultado2: " + Resultado.insertId);
          let idresultadochecklist = Resultado.insertId;
          //localStorage.setItem("sync",(parseInt(localStorage.getItem("sync"))+1).toString());
          for(var index in this.checklistcontroles) { 
            var attr = this.checklistcontroles[index];
            db2.executeSql('INSERT INTO resultadoscontroleschecklist (idcontrolchecklist,idchecklist, resultado, descripcion, fotocontrol, idresultadochecklist) VALUES (?,?,?,?,?,?)',[attr.idcontrol,this.idchecklist,attr.checked,attr.descripcion,attr.foto,idresultadochecklist]).then(
          (Resultado) => { console.log(Resultado);},
          (error) => {console.log(JSON.stringify(error))});
        }
          if (this.network.type != 'none') {
            console.log("conected");
            this.sync.sync_data_checklist();
          }
          else {
            localStorage.setItem("syncchecklist", (parseInt(localStorage.getItem("syncchecklist")) + 1).toString());
            this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));
          }
  
},
  (error) => {console.log(JSON.stringify(error))});
  });

this.navCtrl.pop();
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
        console.log(err);
    });
    console.log(this.checklistcontroles);
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
        {text: cancel,role: 'cancel',handler: () => {console.log('Cancel clicked');}}
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
