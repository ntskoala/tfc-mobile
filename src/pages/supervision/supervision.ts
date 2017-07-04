import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ActionSheetController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';

import { Sync } from '../../providers/sync';
import { SyncPage } from '../sync/sync';
import { Servidor } from '../../providers/servidor';
import { Initdb } from '../../providers/initdb'

import { Network } from '@ionic-native/network';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { URLS, controlesList, checklistList, checkLimpieza, limpiezaRealizada, supervisionLimpieza, Supervision } from '../../models/models'
import * as moment from 'moment';
/**
 * Generated class for the SupervisionPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-supervision',
  templateUrl: 'supervision.html',
  providers: [SyncPage]
})
export class SupervisionPage {
  mislimpiezasrealizadas: any;


  public supervisionLimpiezas: supervisionLimpieza[] = [];
  public loader: any;
  constructor(public navCtrl: NavController, public navParams: NavParams, private data: Initdb, private sync: Sync, private servidor: Servidor, private alertCtrl: AlertController, public actionSheetCtrl: ActionSheetController, public initdb: Initdb, public syncPage: SyncPage, private translate: TranslateService, public db: SQLite, public network: Network, public loadingCtrl: LoadingController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SupervisionPage');

  }
  ionViewDidEnter() {
    console.log('ionViewDidEnter SupervisionPage');
    this.presentLoading();
    this.refreshLimpiezas().then(
      (resultado)=>{
        this.closeLoading();
      }
    );
  }
  refreshLimpiezas() {
    return new Promise((resolve, reject) => {
      console.log(this.network.type)
      if (this.network.type != 'none') {
        
        this.setLimpiezasRealizadas().then(
          (data) => {
            console.log('data: ' + data);
            if (data == 'ok') {
              console.log('getting limpiezasRealizadas: ' + data);
              this.getLimpiezasRealizadas();
              resolve('actualizado');
            } else {
              alert(data);
              resolve(data);
            }
          }
        );
        let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' + sessionStorage.getItem("password");
        this.servidor.login(URLS.LOGIN, param).subscribe(
          response => {
            if (response.success == 'true') {
              // Guarda token en sessionStorage
              sessionStorage.setItem('token', response.token);
            }
          });
      } else {
        this.getLimpiezasRealizadas();
        resolve('sin red');
      }
    });
  }

  setLimpiezasRealizadas() {
    return new Promise((resolve, reject) => {
      this.sync.getMisLimpiezasRealizadas(this.data.logged).map(res => res.json()).subscribe(
        data => {
          this.mislimpiezasrealizadas = JSON.parse(data);
          console.log('resultado limpiezasRealizadas: ' + this.mislimpiezasrealizadas.success);
          //    console.log('success check: ' +this.mischecks.data[0].nombre);
          if (this.mislimpiezasrealizadas.success) {
            console.log("if LIMPIEZAS REALIZADAS.SUCEESS");
            //test
            this.mislimpiezasrealizadas = this.mislimpiezasrealizadas.data;
            if (this.mislimpiezasrealizadas) {
              console.log("mislimpiezasrealizadas: " + this.mislimpiezasrealizadas);
              this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
                db2.executeSql("delete from supervisionlimpieza", []).then((data) => {
                  console.log(JSON.stringify('deleted limpiezas: ', data.res));
                  let counter = 1;
                  //this.mislimpiezasrealizadas.forEach (limpiezarealizada => this.saveLimpiezaRealizada(limpiezarealizada));
                  for (let x = 0; x <= this.mislimpiezasrealizadas.length - 1; x++) {
                    console.log('for', x, counter);
                    this.saveLimpiezaRealizada(this.mislimpiezasrealizadas[x], x).then(
                      (resultado) => {
                        console.log(resultado, counter, this.mislimpiezasrealizadas.length);
                        console.log(counter == this.mislimpiezasrealizadas.length);
                        if (counter == this.mislimpiezasrealizadas.length) {
                          console.log('resolve ok');
                          resolve('ok');
                        }
                        counter++
                      });

                  }

                }

                  , (error) => {
                    console.log("ERROR home. 211 delete limpiezas Realizadas-> " + JSON.stringify(error));
                    //alert("Error 2");
                  });
              });
            }
            //this.mischecks.forEach (checklist => this.saveChecklist(checklist));
          }

        },
        err => {
          console.error(err);
          resolve('error:' + err)
        },
        () => {
        }
      );
    });
  }

  saveLimpiezaRealizada(limpiezaRealizada, counter) {
    return new Promise((resolve, reject) => {
      this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
        console.log("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision)) VALUES (?,?,?,?,?,?,?)", limpiezaRealizada.id, limpiezaRealizada.nombre, limpiezaRealizada.fecha, limpiezaRealizada.tipo, limpiezaRealizada.responsable, limpiezaRealizada.supervisor, limpiezaRealizada.supervision);
        db2.executeSql("INSERT INTO supervisionlimpieza (idlimpiezarealizada,  nombrelimpieza, fecha, tipo,  responsable, idsupervisor, supervision) VALUES (?,?,?,?,?,?,?)", [limpiezaRealizada.id, limpiezaRealizada.nombre, limpiezaRealizada.fecha, limpiezaRealizada.tipo, limpiezaRealizada.responsable, limpiezaRealizada.supervisor, limpiezaRealizada.supervision]).then((data) => {
          resolve(counter);
        }, (error) => {
          console.log("ERROR SAVING limpiezaRealizada-> " + JSON.stringify(error));
        });
      });
    });
  }

  getLimpiezasRealizadas() {

    this.supervisionLimpiezas = [];
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      db2.executeSql("SELECT * FROM supervisionlimpieza WHERE idsupervisor = ?", [sessionStorage.getItem("idusuario")]).then((data) => {
        for (let i = 0; i < data.rows.length; i++) {
          this.supervisionLimpiezas.push(new supervisionLimpieza(
            data.rows.item(i).id,
            data.rows.item(i).idlimpiezarealizada,
            data.rows.item(i).nombrelimpieza,
            data.rows.item(i).fecha,
            data.rows.item(i).tipo,
            data.rows.item(i).responsable,
            data.rows.item(i).idsupervisor,
            data.rows.item(i).fecha_supervision,
            data.rows.item(i).supervision,
            data.rows.item(i).detalles_supervision
          ));
        }
      }, (error) => {
        console.log("ERROR -> " + JSON.stringify(error.err));
        alert("error home 276" + JSON.stringify(error.err));
      });
    });
    console.log("LIMPIEZAS REALIZADAS", this.supervisionLimpiezas)
  }

  terminar() {
    let fecha = moment(new Date()).format('YYYY-MM-DD HH:mm');
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      this.supervisionLimpiezas.forEach((limpiezaRealizada) => {
        if (limpiezaRealizada.supervision != 0) {
          // db2.executeSql('UPDATE supervisionlimpieza SET  (fecha_supervision,supervision,detalles_supervision) VALUES (?,?,?) WHERE id = ?',[fecha,limpiezaRealizada.supervision,limpiezaRealizada.detalles_supervision, limpiezaRealizada.id]).then(
          db2.executeSql('UPDATE supervisionlimpieza SET  fecha_supervision = ?,supervision= ?,detalles_supervision= ? WHERE id = ?', [fecha, limpiezaRealizada.supervision, limpiezaRealizada.detalles_supervision, limpiezaRealizada.id]).then(
            (Resultado) => {
              console.log(Resultado);
              localStorage.setItem("syncsupervision", (parseInt(localStorage.getItem("syncsupervision")) + 1).toString());
            },
            (error) => { console.log(JSON.stringify(error)) });
        }
      });
      if (this.network.type != 'none') {
        console.log("conected");
        let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' + sessionStorage.getItem("password");
        this.servidor.login(URLS.LOGIN, param).subscribe(
          response => {
            if (response.success == 'true') {
              // Guarda token en sessionStorage
              sessionStorage.setItem('token', response.token);
              this.syncPage.sync_data_supervision();
            }
          });

      }
      else {
        console.log("not conected");
        this.initdb.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist")) + parseInt(localStorage.getItem("syncsupervision"));
      }
    });
    this.navCtrl.pop();
  }

  // setSupervision(){
  //   console.log('Supervision started');
  // this.supervisionLimpiezas.forEach((limpiezaRealizada)=>{
  //       if (limpiezaRealizada.supervision != 0){
  //             let supervision = new Supervision(limpiezaRealizada.idlimpiezarealizada,limpiezaRealizada.idsupervisor, limpiezaRealizada.fecha_supervision, limpiezaRealizada.supervision,limpiezaRealizada.detalles_supervision);
  //             //arrayfila.push(data.rows.item[fila]);
  //             let param = "?entidad=limpieza_realizada&id="+limpiezaRealizada.idlimpiezarealizada;
  //             this.servidor.putObject(URLS.STD_ITEM, param, supervision).subscribe(
  //               response => {
  //                 if (response.success) {
  //                   console.log('Supervision sended', response.id);

  //                 }
  //               },
  //               error => console.log(error),
  //               () => { console.log('Supervision ended');});
  //       }
  // });

  // }


  opciones(supervision) {
    let correcto;
    let incorrecto;
    let aplica;
    let valor;
    let descrip;
    let cancel;
    this.translate.get("correcto").subscribe(resultado => { correcto = resultado; });
    this.translate.get("incorrecto").subscribe(resultado => { incorrecto = resultado; });
    this.translate.get("no aplica").subscribe(resultado => { aplica = resultado; });
    this.translate.get("valor").subscribe(resultado => { valor = resultado; });
    this.translate.get("descripcion").subscribe(resultado => { descrip = resultado; });
    this.translate.get("cancel").subscribe(resultado => { cancel = resultado; });
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Opciones',
      buttons: [
        { text: correcto, icon: 'checkmark-circle', handler: () => { supervision.supervision = 1; } },
        { text: incorrecto, icon: 'close-circle', handler: () => { supervision.supervision = 2; } },
        { text: descrip, icon: 'clipboard', handler: () => { this.editar(supervision); } },
        { text: cancel, role: 'cancel', handler: () => { console.log('Cancel clicked'); } }
      ]
    });
    actionSheet.present();
  }

  editar(supervision) {
    let prompt = this.alertCtrl.create({
      title: 'Descripcion',
      inputs: [{ name: 'descripcion' }],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Add', handler: data => { supervision.detalles_supervision = data.descripcion; }
        }]
    });
    prompt.present();
  }
  presentLoading() {
    console.log('##SHOW LOADING');
    this.loader = this.loadingCtrl.create({
      content: "Actualizando...",
      // duration: 3000
    });
    this.loader.present();
    //loader.dismiss();
  }
  closeLoading() {
    console.log('##HIDE LOADING');
    setTimeout(() => {
      console.log('Async operation has ended');
      this.loader.dismiss()
    }, 1000);
  }

  doRefresh(refresher) {
    console.log('Begin async operation', refresher);
    this.refreshLimpiezas().then(
      (resultado)=>{
        refresher.complete();
      }
    );

  }
}
