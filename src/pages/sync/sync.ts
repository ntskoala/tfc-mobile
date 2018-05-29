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
import { URLS, ResultadoControl, ResultadoControlLocal, ResultadoCechklist, ResultadosControlesChecklist, checkLimpieza, limpiezaRealizada, Supervision, mantenimientoRealizado, Incidencia } from '../../models/models';

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
  constructor(public navCtrl: NavController, public initdb: Initdb, public sync: Sync, public servidor: Servidor, 
    public translate: TranslateService, public db: SQLite, public network: Network) {
    if (this.network.type != 'none') {
      console.log("conected");
    }
    this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+ parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
  }

  alerta(text) {
    alert(text);
  }

  ionViewDidLoad() {
    console.log('Hello Sync Page');

  }
login(){
  if (this.isTokenExired(localStorage.getItem('token')) && this.network.type != 'none'){

    let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
  this.servidor.login(URLS.LOGIN, param).subscribe(
    response => {
      if (response.success == 'true') {
        // Guarda token en sessionStorage
        localStorage.setItem('token', response.token);
        }
        });
      
}
}

isTokenExired (token) {
  if (token){
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  //return JSON.parse(window.atob(base64));
  let jwt = JSON.parse(window.atob(base64));
  console.log (moment.unix(jwt.exp).isBefore(moment()));
 return moment.unix(jwt.exp).isBefore(moment());
  }else{
    return true;
  }
}

  sync_data() {
    if (this.network.type != 'none') {
 let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
    this.servidor.login(URLS.LOGIN, param).subscribe(
      response => {
        if (response.success == 'true') {
          // Guarda token en sessionStorage
          localStorage.setItem('token', response.token);
        }else{}
      this.sync_data_control();
      this.sync_data_checklist();
      this.sync_checklimpieza();
      this.sync_data_supervision();
      this.sync_mantenimientos();
      this.sync_incidencias(-1,0,'Incidencias');
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
      console.log("base de datos abierta 1");


      db2.executeSql("select id,idcontrol,resultado,fecha,foto, idusuario from resultadoscontrol", []).then((data) => {
        console.log("executed sql" + data.rows.length);
        if (data.rows.length > 0) {
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {

            console.log(data.rows.item(fila));
            //let checklist = new ResultadoCechklist ()
            //arrayfila.push(data.rows.item(fila))
            arrayfila.push(new ResultadoControlLocal(data.rows.item(fila).idcontrol, data.rows.item(fila).resultado, data.rows.item(fila).fecha, data.rows.item(fila).foto, data.rows.item(fila).idusuario, data.rows.item(fila).id));
          }
          arrayfila.forEach((fila)=>{
           //*******INICIO FOREACH */   
           console.log('FILA CONTROL', fila);
           let newArray = [new ResultadoControl(fila.idcontrol, fila.resultado, fila.fecha, fila.foto, fila.idusuario)];     
          this.sync.setResultados(JSON.stringify(newArray), "resultadoscontrol")
            .subscribe(data => {
              console.log("control5",data);
              this.sync_incidencias(fila.idLocal, data.id, 'Controles');
              this.updateFechaElemento(fila.idcontrol,'controles','id');
              localStorage.setItem("synccontrol", "0");
              this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
              this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
            },
            error => 
            console.log("control6" + error)
            ,
            () => 
            console.log("ok")
          );
          //*******FIN FOREACH */
        });
        }
      }, (error) => {
        console.log(error);
        alert("error, no se han podido sincronizar todos los datos [resultadoscontroles] " + error.message);
      });

    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
    });

  }
  updateFechaElemento(idElemento:number,entidad:string, identificador:string) {
    if (this.network.type != 'none') {
      let fecha = moment(new Date()).format('YYYY-MM-DD');
      let proxima_fecha = '';
      this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
        db2.executeSql("Select * FROM " + entidad + " WHERE " + identificador + " = ? AND fecha >= ?", [idElemento, fecha]).then((data) => {
          let proxima_fecha;
          console.log('resultados update fecha',data.rows.length);
          for (var index = 0; index < data.rows.length; index++) {
            proxima_fecha = moment(data.rows.item(index).fecha).format('YYYY-MM-DD');
          }
          let param = "?entidad=" + entidad + "&id=" + idElemento;
          let control;
          if (entidad == 'controles' || entidad == 'checklist'){
           control = { fecha_: proxima_fecha};
          }else{
            control = { fecha: proxima_fecha};
          }
          console.log('UPDATING REMOTE DATE',entidad,idElemento,identificador,control);
          this.servidor.putObject(URLS.STD_FECHA, param, control).subscribe(
            (resultado) =>{
              if (resultado.success == "nuevaFecha"){
              db2.executeSql("UPDATE " + entidad + " SET fecha  = ? WHERE " + identificador + " = ?", [resultado.nuevaFecha, idElemento]).then((data) => {
                console.log('UPDATING LOCAL DATE',entidad,resultado.nuevaFecha);
              },
            (error)=>{console.log('ERRORLOG',error)});
              }
            },
            (error) =>{console.log('********',error);},
            () => {});
        },
      (error)=>{console.log('error select update Fecha',error);});
      });
    }
  }

  sync_data_checklist() {

    //this.db = new SQLite();
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.log("base de datos abierta");


      db2.executeSql("select idlocal,idchecklist,fecha,foto, idusuario from resultadoschecklist", []).then((data) => {
        if (data.rows.length > 0) {

          for (let fila = 0; fila < data.rows.length; fila++) {
            let resultadoChecklist = new ResultadoCechklist(data.rows.item(fila).idlocal, data.rows.item(fila).idchecklist, data.rows.item(fila).fecha, data.rows.item(fila).foto, data.rows.item(fila).idusuario)
            console.log(data.rows.item(fila));
            let idlocal = data.rows.item(fila).idlocal;
            //let arrayfila =[data.rows.item(fila)];
            let arrayfila = [resultadoChecklist];
            arrayfila.push()
            let idrespuesta = this.sync.setResultados(JSON.stringify(arrayfila), "resultadoschecklist")
              .subscribe(data => {
                this.sync_incidencias(idlocal, data.id, 'Checklists');
                this.sync_checklistcontroles(data.id, idlocal);
                arrayfila.forEach((checklist)=>{this.updateFechaElemento(checklist.idchecklist,'checklist','idchecklist');})
                
              });
            console.log("returned" + idrespuesta);
          }
          localStorage.setItem("syncchecklist", "0");
          this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
          this.badge = parseInt(localStorage.getItem("synccontrol")) + parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
        }
      }, (error) => {
        console.log("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [resultadoschecklist]" + JSON.stringify(error.err));
      });

    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
    });
  }

  sync_checklistcontroles(id, idlocal) {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.log("base de datos abierta");

      console.log("send: " + id + " idlocal= " + idlocal);
      db2.executeSql("select idcontrolchecklist,  " + id + " as idresultadochecklist ,resultado,descripcion,fotocontrol from resultadoscontroleschecklist WHERE idresultadochecklist = ?", [idlocal]).then((data) => {
        console.log(data.rows.length);
        if (data.rows.length > 0) {
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {
            console.log(data.rows.item(fila));

            //arrayfila.push(data.rows.item(fila))
            arrayfila.push(new ResultadosControlesChecklist(data.rows.item(fila).idcontrolchecklist, data.rows.item(fila).idresultadochecklist, data.rows.item(fila).resultado, data.rows.item(fila).descripcion, data.rows.item(fila).fotocontrol))
          }
          this.sync.setResultados(JSON.stringify(arrayfila), "resultadoscontroleschecklist")
            .subscribe(data => { console.log("control3") },
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


  sync_checklimpieza() {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.log("base de datos abierta");

      console.log("send limpiezas: ");
      db2.executeSql("select * from resultadoslimpieza ", []).then((data) => {
        console.log(data.rows.length);
        let param = "&entidad=limpieza_realizada";
        let arrayfila = [];// : limpiezaRealizada[]=[];
        if (data.rows.length > 0) {

          for (let fila = 0; fila < data.rows.length; fila++) {
           // let arrayfila = [];
            //arrayfila.push(new limpiezaRealizada(null, data.rows.item(fila).idelemento, data.rows.item(fila).idempresa, data.rows.item(fila).fecha_prevista, data.rows.item(fila).fecha, data.rows.item(fila).nombre, data.rows.item(fila).descripcion, data.rows.item(fila).tipo, data.rows.item(fila).idusuario, data.rows.item(fila).responsable, data.rows.item(fila).idlimpiezazona))
            let limpieza = new limpiezaRealizada(null, data.rows.item(fila).idelemento, data.rows.item(fila).idempresa, data.rows.item(fila).fecha_prevista, data.rows.item(fila).fecha, data.rows.item(fila).nombre, data.rows.item(fila).descripcion, data.rows.item(fila).tipo, data.rows.item(fila).idusuario, data.rows.item(fila).responsable, data.rows.item(fila).idlimpiezazona, data.rows.item(fila).idsupervisor);
            //arrayfila.push(data.rows.item[fila]);
            this.servidor.postObject(URLS.STD_ITEM, limpieza, param).subscribe(
              response => {
                if (response.success) {
                  this.updateFechaElementoLimpieza(data.rows.item(fila).idelemento,data.rows.item(fila));
                  //this.sync_incidencias(fila.idLocal, data.id, 'Controles');
                  this.sync_incidencias(data.rows.item(fila).id, response.id, 'Limpiezas');
                  console.log('limpieza realizada sended', response.id);
                  db2.executeSql("DELETE from resultadoslimpieza WHERE id = ?", [ data.rows.item(fila).id]).then((data) => {
                    console.log("deleted",data.rows.length);
                  });
                }
              },
              error => console.log(error),
              () => { });
          }
          localStorage.setItem("syncchecklimpieza", "0");
          this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));

          // let param = "&entidad=limpieza_realizada";
          // this.servidor.postObject(URLS.STD_ITEM, JSON.stringify(arrayfila),param).subscribe(
          //   response => {
          //     if (response.success) {
          //     console.log('limpieza realizada sended',response.id);
          //   }},
          // error=>console.log(error),
          // ()=>{});
        }
      }, (error) => {
        console.log("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [limpiezasRealizadas]" + JSON.stringify(error.err));
      });
    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
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
            proxima_fecha = moment(data.rows.item(index).fecha).format('YYYY-MM-DD');
          }
          console.log("proxima_fecha ", proxima_fecha);
          let param = "?entidad=limpieza_elemento&id=" + idElementoLimpieza;
          let limpia = { fecha: proxima_fecha };
          this.servidor.putObject(URLS.STD_ITEM, param, limpia).subscribe(
            (resultado) => 
            console.log(resultado)
            ,
            (error) => 
            console.log(error)
            ,
            () => 
            console.log('fin updating fecha')
          );
        });
      });
    }
  }

  sync_data_supervision() {
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      console.log("sync data spervision");

      console.log("send limpiezas: ");
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
              error => console.log(error),
              () => { });
          }
                localStorage.setItem("syncsupervision", "0");
                this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));

          // let param = "&entidad=limpieza_realizada";
          // this.servidor.postObject(URLS.STD_ITEM, JSON.stringify(arrayfila),param).subscribe(
          //   response => {
          //     if (response.success) {
          //     console.log('limpieza realizada sended',response.id);
          //   }},
          // error=>console.log(error),
          // ()=>{});
        }
      }, (error) => {
        console.log("ERROR -> " + JSON.stringify(error.err));
        alert("error, no se han podido sincronizar todos los datos [limpiezasRealizadas]" + JSON.stringify(error.err));
      });
    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
    });
  }

  sync_mantenimientos(){
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      db2.executeSql("select * from mantenimientosrealizados", []).then((data) => {
        if (data.rows.length > 0) {
          console.log('anviar elementos:',data.rows.length);
          let param = "&entidad=mantenimientos_realizados";
          let entidad;
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {
            let mantenimiento = new mantenimientoRealizado(null, data.rows.item(fila).idmantenimiento, data.rows.item(fila).idmaquina, data.rows.item(fila).maquina, 
            data.rows.item(fila).mantenimiento,data.rows.item(fila).fecha_prevista,data.rows.item(fila).fecha,data.rows.item(fila).idusuario,data.rows.item(fila).responsable,
            data.rows.item(fila).descripcion,data.rows.item(fila).elemento,data.rows.item(fila).tipo,data.rows.item(fila).tipo2,
            data.rows.item(fila).causas,data.rows.item(fila).tipo_evento,data.rows.item(fila).idempresa,data.rows.item(fila).imagen);
          
            this.servidor.postObject(URLS.STD_ITEM, mantenimiento, param).subscribe(
              response => {
                if (response.success) {
                  if (data.rows.item(fila).idmantenimiento > 0){
                  if(mantenimiento.tipo_evento == "mantenimiento"){
                    entidad = "maquina_mantenimiento";
                    }else{
                    entidad = "maquina_calibraciones";              
                    }   
                  this.sync_incidencias(data.rows.item(fila).id, response.id, 'Maquinaria');        
                  this.updateFechaElemento(mantenimiento.idmantenimiento,entidad,'id');
                    }
                  db2.executeSql("DELETE from mantenimientosrealizados WHERE id = ?", [ data.rows.item(fila).id]).then((data) => {
                    console.log("deleted 1 item");
                  },
                (error)=>{console.log('Deleting mantenimientosrelizados ERROR',error)});
                }
              },
              error => console.log(error),
              () => { });
            }
            localStorage.setItem("syncmantenimiento","0");
            this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
        }
      }, (error) => {
        console.log(error);
        alert("error, no se han podido sincronizar todos los datos [mantenimientosrealizados] " + error.message);
      });
    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
    });
  }

  sync_incidencias(idElemento,idOrigen, origen){
    console.log('seleccionar incidencias a enviar:',idElemento, idOrigen, origen);
    this.db.create({ name: "data.db", location: "default" }).then((db2: SQLiteObject) => {
      db2.executeSql("select * from incidencias WHERE idElemento = ? AND origen = ?", [idElemento, origen]).then((data) => {
        if (data.rows.length > 0) {
          console.log('enviar incidencias:',data.rows.length);
          let param = "&entidad=incidencias";
          let entidad;
          let arrayfila = [];
          for (let fila = 0; fila < data.rows.length; fila++) {
            let incidencia = new Incidencia(null, data.rows.item(fila).fecha, data.rows.item(fila).incidencia, data.rows.item(fila).solucion, 
            data.rows.item(fila).responsable,data.rows.item(fila).idempresa, data.rows.item(fila).origen,idOrigen,
            data.rows.item(fila).origenasociado,data.rows.item(fila).idOrigenasociado,
            data.rows.item(fila).foto,data.rows.item(fila).descripcion,data.rows.item(fila).estado);
          
            this.servidor.postObject(URLS.STD_ITEM, incidencia, param).subscribe(
              response => {
                if (response.success) {
                  console.log('incidencia guardada:',response.id);
                  incidencia.id= response.id;
                  this.sendMailIncidencia(incidencia);
                  db2.executeSql("DELETE from incidencias WHERE id = ?", [ data.rows.item(fila).id]).then((data) => {
                    console.log("deleted 1 item incidencia");
                  },
                (error)=>{console.log('Deleting incidencias ERROR',error)});
                }
              },
              error => console.log(error),
              () => { });
            }
            localStorage.setItem("syncincidencia","0");
            this.initdb.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"))+parseInt(localStorage.getItem("syncsupervision"))+parseInt(localStorage.getItem("syncchecklimpieza"))+parseInt(localStorage.getItem("syncmantenimiento"))+parseInt(localStorage.getItem("syncincidencia"));
        }
      }, (error) => {
        console.log(error);
        alert("error, no se han podido sincronizar todos los datos [incidencias] " + error.message);
      });
    }, (error) => {
      console.log("ERROR al abrir la bd: ", error);
    });
  }

  sendMailIncidencia(nuevaIncidencia){
    console.log("sendmail start: ");
    this.loadUsuarios().then(
      (respuesta)=>{
    let responsables = respuesta["data"];
    console.log("sendmail got users: ",responsables);
    let body = "Nueva incidencia creada desde " + nuevaIncidencia.origen + "<BR>Por: " +  responsables[responsables.findIndex((responsable)=>responsable["value"] == nuevaIncidencia.responsable)]["label"]
    body +=   "<BR>Con fecha y hora: " + moment(nuevaIncidencia.fecha).format('DD-MM-YYYY hh-mm') +  "<BR>"
    body +=   "<BR>Nombre: " + nuevaIncidencia.incidencia +  "<BR>"
    body +=   "Descripción: " + nuevaIncidencia.descripcion;
    body +=   "<BR>Solución inmediata propuesta: " + nuevaIncidencia.solucion;
    body +=   "<BR>Ir a la incidencia: " + URLS.SERVER + "empresas/"+ localStorage.getItem("idempresa") +"/incidencias/0/" + nuevaIncidencia.id + ""
    if (nuevaIncidencia.origen != 'incidencias')
    body +=    "<BR>Ir al elemento " + URLS.SERVER + "empresas/"+ localStorage.getItem("idempresa") +"/"+ nuevaIncidencia.origenasociado +"/"+ nuevaIncidencia.idOrigenasociado +"/" + nuevaIncidencia.idOrigen + ""
    let parametros2 = "&body="+body+'&idempresa=' + sessionStorage.getItem("idempresa");
        this.servidor.getObjects(URLS.ALERTES, parametros2).subscribe(
          response => {
            if (response.success && response.data) {
              console.log('email alerta enviado');
            }
        });
      });
  }
  
  loadUsuarios(){
    return new Promise((resolve)=>{
      console.log("get users: ");
    let responsables :any[];
    let params = localStorage.getItem("idempresa");
    let parametros2 = "&entidad=usuarios"+'&idempresa=' + params;
        this.servidor.getObjects(URLS.STD_ITEM, parametros2).subscribe(
          response => {
            responsables = [];
            if (response.success && response.data) {
            //  console.log(response.data)
              for (let element of response.data) {  
                responsables.push({'label':element.usuario,'value':element.id});
             }
             resolve ({"data":responsables})
            }
        });
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
