import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Network } from '@ionic-native/network';
import { Sync } from '../../providers/sync';
import { Initdb } from '../../providers/initdb';
import { Servidor } from '../../providers/servidor';
import * as moment from 'moment';
import { MyApp } from '../../app/app.component';
import { URLS, ResultadoControl, ResultadoCechklist, ResultadosControlesChecklist, checkLimpieza, limpiezaRealizada, Supervision } from '../../models/models';

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
  constructor(public navCtrl: NavController, public initdb: Initdb, public sync: Sync, public servidor: Servidor, public translate: TranslateService, public db: SQLite, public network: Network) {
    if (this.network.type != 'none') {
      console.debug("conected");
    }
    this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+ parseInt(localStorage.getItem("syncsupervision"));
  }

  alerta(text) {
    alert(text);
  }

  ionViewDidLoad() {
    console.debug('Hello Sync Page');
  }

  sync_data() {
    if (this.network.type != 'none') {
 let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
    this.servidor.login(URLS.LOGIN, param).subscribe(
      response => {
        if (response.success == 'true') {
          // Guarda token en sessionStorage
          sessionStorage.setItem('token', response.token);
      this.sync_data_control();
      this.sync_data_checklist();
      this.sync_checklimpieza();
      this.sync_data_supervision();
          }
          });
    }
    else {
      this.translate.get("alertas.conexion").subscribe(resultado => alert(resultado));
    }
  }

  sync_data_control() {
    //alert("hay sinc");
    //this.db2 = new SQLite();
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.debug("base de datos abierta 1");


      db2.executeSql("select idcontrol,resultado,fecha,foto, idusuario from resultadoscontrol", []).then((data) => {
        console.debug("executed sql" + data.rows.length);
        if (data.rows.length > 0) {
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {

            console.debug(data.rows.item(fila));
            //let checklist = new ResultadoCechklist ()
            //arrayfila.push(data.rows.item(fila))
            arrayfila.push(new ResultadoControl(data.rows.item(fila).idcontrol, data.rows.item(fila).resultado, data.rows.item(fila).fecha, data.rows.item(fila).foto, data.rows.item(fila).idusuario));
          }

          this.sync.setResultados(JSON.stringify(arrayfila), "resultadoscontrol")
            .subscribe(data => {
              console.debug("control5")
              localStorage.setItem("synccontrol", "0");
             // this.initdb.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"));
             // this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"));
            },
            error => console.debug("control6" + error),
            () => console.debug("ok"));
        }
      }, (error) => {
        console.debug(error);
        alert("error, no se han podido sincronizar todos los datos [resultadoscontroles] " + error.message);
      });

    }, (error) => {
      console.debug("ERROR al abrir la bd: ", error);
    });

  }

  sync_data_checklist() {

    //this.db = new SQLite();
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.debug("base de datos abierta");


      db2.executeSql("select idlocal,idchecklist,fecha,foto, idusuario from resultadoschecklist", []).then((data) => {
        if (data.rows.length > 0) {

          for (let fila = 0; fila < data.rows.length; fila++) {
            let resultadoChecklist = new ResultadoCechklist(data.rows.item(fila).idlocal, data.rows.item(fila).idchecklist, data.rows.item(fila).fecha, data.rows.item(fila).foto, data.rows.item(fila).idusuario)
            console.debug(data.rows.item(fila));
            let idlocal = data.rows.item(fila).idlocal;
            //let arrayfila =[data.rows.item(fila)];
            let arrayfila = [resultadoChecklist];
            arrayfila.push()
            let idrespuesta = this.sync.setResultados(JSON.stringify(arrayfila), "resultadoschecklist")
              .subscribe(data => this.sync_checklistcontroles(data.id, idlocal));
            console.debug("returned" + idrespuesta);
          }
          localStorage.setItem("syncchecklist", "0");
          this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));
          this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"));
        }
      }, (error) => {
        console.debug("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [resultadoschecklist]" + JSON.stringify(error.err));
      });

    }, (error) => {
      console.debug("ERROR al abrir la bd: ", error);
    });
  }

  sync_checklistcontroles(id, idlocal) {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.debug("base de datos abierta");

      console.debug("send: " + id + " idlocal= " + idlocal);
      db2.executeSql("select idcontrolchecklist,  " + id + " as idresultadochecklist ,resultado,descripcion,fotocontrol from resultadoscontroleschecklist WHERE idresultadochecklist = ?", [idlocal]).then((data) => {
        console.debug(data.rows.length);
        if (data.rows.length > 0) {
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {
            console.debug(data.rows.item(fila));

            //arrayfila.push(data.rows.item(fila))
            arrayfila.push(new ResultadosControlesChecklist(data.rows.item(fila).idcontrolchecklist, data.rows.item(fila).idresultadochecklist, data.rows.item(fila).resultado, data.rows.item(fila).descripcion, data.rows.item(fila).fotocontrol))
          }
          this.sync.setResultados(JSON.stringify(arrayfila), "resultadoscontroleschecklist")
            .subscribe(data => { console.debug("control3") },
            error => console.debug("control4" + error),
            () => console.debug("fin"));
        }
      }, (error) => {
        console.debug("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [resultadoscontrolchecklist]" + JSON.stringify(error.err));
      });
    }, (error) => {
      console.debug("ERROR al abrir la bd: ", error);
    });

  }


  sync_checklimpieza() {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.debug("base de datos abierta");

      console.debug("send limpiezas: ");
      db2.executeSql("select * from resultadoslimpieza ", []).then((data) => {
        console.debug(data.rows.length);
        let param = "&entidad=limpieza_realizada";
        let arrayfila = [];// : limpiezaRealizada[]=[];
        if (data.rows.length > 0) {

          for (let fila = 0; fila < data.rows.length; fila++) {
           // let arrayfila = [];
            //arrayfila.push(new limpiezaRealizada(null, data.rows.item(fila).idelemento, data.rows.item(fila).idempresa, data.rows.item(fila).fecha_prevista, data.rows.item(fila).fecha, data.rows.item(fila).nombre, data.rows.item(fila).descripcion, data.rows.item(fila).tipo, data.rows.item(fila).idusuario, data.rows.item(fila).responsable, data.rows.item(fila).idlimpiezazona))
            let limpieza = new limpiezaRealizada(null, data.rows.item(fila).idelemento, data.rows.item(fila).idempresa, data.rows.item(fila).fecha_prevista, data.rows.item(fila).fecha, data.rows.item(fila).nombre, data.rows.item(fila).descripcion, data.rows.item(fila).tipo, data.rows.item(fila).idusuario, data.rows.item(fila).responsable, data.rows.item(fila).idlimpiezazona);
            //arrayfila.push(data.rows.item[fila]);
            this.servidor.postObject(URLS.STD_ITEM, limpieza, param).subscribe(
              response => {
                if (response.success) {
                  this.updateFechaElementoLimpieza(data.rows.item(fila).idelemento,data.rows.item(fila));
                  console.debug('limpieza realizada sended', response.id);
                  db2.executeSql("DELETE from resultadoslimpieza WHERE id = ?", [ data.rows.item(fila).id]).then((data) => {
                    console.debug("deleted",data.rows.length);
                  });
                }
              },
              error => console.debug(error),
              () => { });
          }
          localStorage.setItem("syncchecklimpieza", "0");
          this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));

          // let param = "&entidad=limpieza_realizada";
          // this.servidor.postObject(URLS.STD_ITEM, JSON.stringify(arrayfila),param).subscribe(
          //   response => {
          //     if (response.success) {
          //     console.debug('limpieza realizada sended',response.id);
          //   }},
          // error=>console.debug(error),
          // ()=>{});
        }
      }, (error) => {
        console.debug("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [limpiezasRealizadas]" + JSON.stringify(error.err));
      });
    }, (error) => {
      console.debug("ERROR al abrir la bd: ", error);
    });
  }

  updateFechaElementoLimpieza(idElementoLimpieza,LimpiezaRealizada) {
    if (this.network.type != 'none') {
      let fecha = moment(new Date()).format('YYYY-MM-DD');
      let proxima_fecha = '';
      console.log("updating elementoLimpieza");
      this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
        //this.checklistList = data.rows;
        db2.executeSql("Select * FROM checklimpieza WHERE idelemento = ? AND fecha >= ?", [idElementoLimpieza, fecha]).then((data) => {
          let proxima_fecha;
          for (var index = 0; index < data.rows.length; index++) {
            console.log(data.rows.item(index),data.rows.item(index),LimpiezaRealizada.descripcion,LimpiezaRealizada.fecha_prevista)
                
              //   console.log("Setting proxima Fecha de ", LimpiezaRealizada);
              //   if (data.rows.item(index).descripcion =="por uso"){
              //     proxima_fecha = moment(new Date()).format('YYYY-MM-DD');
              //     console.log("Por uso ", proxima_fecha);
              // }else{
              //     let p_fecha= this.nuevaFecha(data.rows.item(index),LimpiezaRealizada.descripcion,LimpiezaRealizada.fecha_prevista);
              //     proxima_fecha = moment(p_fecha).format('YYYY-MM-DD');
              //     console.log("No Por uso ", proxima_fecha, p_fecha);
              // }
            proxima_fecha = moment(data.rows.item(index).fecha).format('YYYY-MM-DD');
          }
          console.log("proxima_fecha ", proxima_fecha);
          let param = "?entidad=limpieza_elemento&id=" + idElementoLimpieza;
          let limpia = { fecha: proxima_fecha };
          this.servidor.putObject(URLS.STD_ITEM, param, limpia).subscribe(
            (resultado) => console.debug(resultado),
            (error) => console.debug(error),
            () => console.debug('fin updating fecha')
          );
        });
      });
    }
  }

  sync_data_supervision() {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.log("sync data spervision");

      console.debug("send limpiezas: ");
      db2.executeSql("select * from supervisionlimpieza WHERE supervision > 0", []).then((data) => {
        console.log("limpiezas realizadas para sincronizar: ",data.rows.length);
        
        let arrayfila = [];// : limpiezaRealizada[]=[];
        if (data.rows.length > 0) {

          for (let fila = 0; fila < data.rows.length; fila++) {
           // let arrayfila = [];
            //arrayfila.push(new limpiezaRealizada(null, data.rows.item(fila).idelemento, data.rows.item(fila).idempresa, data.rows.item(fila).fecha_prevista, data.rows.item(fila).fecha, data.rows.item(fila).nombre, data.rows.item(fila).descripcion, data.rows.item(fila).tipo, data.rows.item(fila).idusuario, data.rows.item(fila).responsable, data.rows.item(fila).idlimpiezazona))
            let supervision = new Supervision(data.rows.item(fila).idlimpiezarealizada,data.rows.item(fila).idsupervisor, data.rows.item(fila).fecha_supervision, data.rows.item(fila).supervision, data.rows.item(fila).detalles_supervision);
            //arrayfila.push(data.rows.item[fila]);
            let param = "?entidad=limpieza_realizada&id="+data.rows.item(fila).idlimpiezarealizada;
            this.servidor.putObject(URLS.STD_ITEM, param, supervision).subscribe(
              response => {
                if (response.success) {
                  console.log('#Supervision sended', response.id, supervision);
                  db2.executeSql("DELETE from supervisionlimpieza WHERE id = ?", [ data.rows.item(fila).id]).then((data) => {
                    console.log("deleted",data.rows.length);
                  });
                }
              },
              error => console.debug(error),
              () => { });
          }
                localStorage.setItem("syncsupervision", "0");
                this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"));

          // let param = "&entidad=limpieza_realizada";
          // this.servidor.postObject(URLS.STD_ITEM, JSON.stringify(arrayfila),param).subscribe(
          //   response => {
          //     if (response.success) {
          //     console.debug('limpieza realizada sended',response.id);
          //   }},
          // error=>console.debug(error),
          // ()=>{});
        }
      }, (error) => {
        console.debug("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [limpiezasRealizadas]" + JSON.stringify(error.err));
      });
    }, (error) => {
      console.debug("ERROR al abrir la bd: ", error);
    });

  }





//************CALCULOS FECHA */
  nuevaFecha(limpieza: checkLimpieza,descripcion?,fecha_prevista?){
      let periodicidad = JSON.parse(limpieza.periodicidad)
      let hoy = new Date();
      let proximaFecha;
       console.log("nuevaFecha", periodicidad, fecha_prevista);
      switch (periodicidad.repeticion){
        case "diaria":
        proximaFecha = this.nextWeekDay(periodicidad);
        break;
        case "semanal":
        proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
        while (moment(proximaFecha).isSameOrBefore(moment())){
        fecha_prevista = proximaFecha;
        proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
        }
        break;
        case "mensual":
        if (periodicidad.tipo == "diames"){
            proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M");
        } else{
          proximaFecha = this.nextMonthDay(fecha_prevista,periodicidad);
        }

        break;
        case "anual":
        if (periodicidad.tipo == "diames"){
          let año = moment(fecha_prevista).get('year') + periodicidad.frecuencia;
        proximaFecha = moment().set({"year":año,"month":parseInt(periodicidad.mes)-1,"date":periodicidad.numdia});
        } else{
          proximaFecha = this.nextYearDay(fecha_prevista,periodicidad);
        }
        break;
      }
      let newdate;
      newdate = moment(proximaFecha).toDate();
      return newdate = new Date(Date.UTC(newdate.getFullYear(), newdate.getMonth(), newdate.getDate()))
}


nextWeekDay(periodicidad:any, fecha?:Date) {
  console.log("nextweekday", periodicidad, fecha);
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

nextMonthDay(fecha_prevista1, periodicidad: any){
  let  proximafecha;
  let fecha_prevista = new Date(fecha_prevista1);
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
nextYearDay(fecha_prevista1, periodicidad: any){
  let proximafecha;
  let fecha_prevista = new Date(fecha_prevista1);
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
}
