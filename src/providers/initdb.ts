import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { Sync } from '../providers/sync';


/*
  Generated class for the Initdb provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class Initdb {
public users: any;
public gerentes: any;
//private storage;
public logged: number;
public badge: number;

//public db: SQLite;

  constructor(public http: Http, public sync: Sync,public db :SQLite) {
    console.log('Hello Initdb Provider');
    //this.db = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then(() => {
            //this.refresh();
            console.log("base de datos abierta");
        }, (error) => {
            console.log("ERROR al abrir la bd: ", error);
        });
  }

 inicializa(){
   // this.db = new SQLite();
        this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
   //  this.storage.query('DROP TABLE IF EXISTS logins');

    db2.executeSql('CREATE TABLE IF NOT EXISTS logins (id INTEGER PRIMARY KEY, user TEXT, password TEXT, tipouser TEXT, nombre TEXT)',[]).then((data) => {
            console.log("TABLE CREATED  LOGINS-> " + JSON.stringify(data));
            //this.sincronizate();
            //localStorage.getItem("idempresa") === null ? console.log("no hay idempresa"): this.sincronizate();
          //  alert ('creada logins');
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error.err));
  });
  //this.db.executeSql('DROP TABLE IF EXISTS controles',[]);
     db2.executeSql('CREATE TABLE IF NOT EXISTS controles (uid INTEGER PRIMARY KEY AUTOINCREMENT,id INTEGER,idusuario INTEGER, nombre TEXT, pla TEXT, minimo INTEGER, maximo INTEGER, objetivo INTEGER, tolerancia INTEGER, critico INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED CONTROLES-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error.err));
  });
  //db.executeSql('DROP TABLE IF EXISTS checklist',[]);
       db2.executeSql('CREATE TABLE IF NOT EXISTS checklist (id INTEGER PRIMARY KEY AUTOINCREMENT, idchecklist INTEGER,idusuario INTEGER, nombrechecklist TEXT, idcontrol INT, nombrecontrol TEXT, checked TEXT DEFAULT "false")',[]).then((data) => {
            console.log("TABLE CREATED CHECKLIST-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error.err));
  });
  //db2.executeSql('DROP TABLE IF EXISTS checklimpieza',[]);
       db2.executeSql('CREATE TABLE IF NOT EXISTS checklimpieza (id INTEGER PRIMARY KEY AUTOINCREMENT, idlimpiezazona INTEGER, idusuario INTEGER, nombrelimpieza TEXT, idelemento INT, nombreelementol TEXT, fecha DATETIME, tipo TEXT, periodicidad TEXT, productos TEXT, protocolo TEXT, responsable TEXT)',[]).then((data) => {
            console.log("TABLE CREATED CHECKLIMPIEZA-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> NO SE CREÓ CHECKLIMPIEZA: ",error);
  });
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoscontrol',[]);
  //*** ATENCION fecha DATETIME DEFAULT CURRENT_TIMESTAMP ES UTC, una hora menos que en españa. se compensa en los informes de backoffice
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoscontrol (id INTEGER PRIMARY KEY AUTOINCREMENT, idcontrol INTEGER, resultado INTEGER, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, foto BLOB, idusuario INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED resultadoscontrol-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoschecklist',[]);
  //*** ATENCION fecha DATETIME DEFAULT CURRENT_TIMESTAMP ES UTC, una hora menos que en españa. se compensa en los informes de backoffice
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoschecklist (idlocal INTEGER PRIMARY KEY AUTOINCREMENT, idchecklist INTEGER, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, foto BLOB, idusuario INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED resultadoschecklist-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoscontroleschecklist',[]);
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoscontroleschecklist (id INTEGER PRIMARY KEY AUTOINCREMENT, idcontrolchecklist INTEGER, idchecklist INTEGER, resultado TEXT, descripcion TEXT, fotocontrol BLOB, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, idresultadochecklist INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED resultadoscontroleschecklist-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
    //this.db.executeSql('DROP TABLE IF EXISTS resultadosLimpieza',[]);
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoslimpieza (id INTEGER PRIMARY KEY AUTOINCREMENT, idelemento INTEGER, idempresa INTEGER, fecha_prevista DATETIME, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, nombre TEXT, descripcion TEXT, tipo TEXT, idusuario INTEGER, responsable TEXT,  idlimpiezazona INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED RESULTADOSLIMPIEZA-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
        });
localStorage.setItem("inicializado","3")
if (localStorage.getItem("versionusers") === null) {localStorage.setItem("versionusers","0")}
//if (localStorage.getItem("versioncontrols") === null) {localStorage.setItem("versioncontrols","0")}
if (localStorage.getItem("synccontrol") === null) {localStorage.setItem("synccontrol","0")}
if (localStorage.getItem("syncchecklist") === null) {localStorage.setItem("syncchecklist","0")}
this.badge = parseInt(localStorage.getItem("synccontrol"))+parseInt(localStorage.getItem("syncchecklist"));

 }




  sincronizate(version?:string){
     
      console.log("llamada sincronizando");
   //USUARIOS
   //USUARIOS
   // DESCARGA USUARIOS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
   return new Promise((resolve,reject)=>{
            this.sync.getMisUsers().subscribe(
            data => {
               this.users = JSON.parse(data.json());
                if (this.users.success){
                    this.users = this.users.data;
                    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                            db2.executeSql("delete from logins",[]).then((data) => {
                            console.log("delete from logins->" + JSON.stringify(data));
                            this.users.forEach (user => this.save(user));
                            }, (error) => {
                            console.log("ERROR -> " + JSON.stringify(error.err));
                            });
                    });
                    //this.users.forEach (user => this.save(user));
                        }
        },
            err => {
                console.error(err);
                reject('error, getting users. initdb#130');
                },
            () => {console.log('getUsuarios completed');
                resolve('ok1');
                if (version) localStorage.setItem("versionusers",version);
                //return new Promise(resolve => {resolve('ok')});
                }
        );  

        //USUARIOS
        //USUARIOS
        // DESCARGA USUARIOS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.

        //GERENTES
        this.sync.setGerentes().subscribe(
            data => {
               this.gerentes = JSON.parse(data.json());
                if (this.gerentes.success){
                    this.gerentes = this.gerentes.data;
                    let array = [];
                    this.gerentes.forEach (gerente => {
                            console.log(gerente.email);
                            array.push(gerente.email);
                            });
                        localStorage.setItem("email",array.toString());
                        }
        },
            err => console.error(err),
            () => {console.log('getGerentes completed')
            }
        );  
        });
  }


  save(user){
      this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
      db2.executeSql("INSERT INTO logins (id, user, password, tipouser, nombre) VALUES (?,?,?,?,?)",[user.id,user.usuario,user.password,user.tipouser,user.nombre]).then((data) => {
           console.log("insert login ->" + JSON.stringify(data));
            }, (error) => {
                  console.log("ERROR INSERTANDO LOGIN-> " + JSON.stringify(error));
                  alert("error " + JSON.stringify(error.err));
              });
      });
}

public getLogin(nombre: string, password:string): any{
    return new Promise((resolve,reject)=>{
    console.log('getlogin...')
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
        console.log('abierta',db2.databaseFeatures);
    return db2.executeSql('select * from logins WHERE user = ? AND password = ?',[nombre,password]).then((data) => {
        console.log('registros',data.rows)
        if (data.rows.length >0){
            //alert ("id" + data.rows.item(0).id);
            this.logged = data.rows.item(0).id;
           console.log ("logged", this.logged);
            sessionStorage.setItem("login",data.rows.item(0).id);
            //localStorage.setItem("idempresa",data.rows.item(0).idempresa);
            //return new Promise ((resolve,reject) => {resolve(true)});
            return resolve('ok')
            }
        else{
            console.log('undefined...')
            this.logged = undefined;

            return reject('no hay registros');
        }
    }, (error) => {
                alert("ERROR executing -> " + JSON.stringify(error));
                //return false;
                return reject('error en la consulta')
            });
    });
    });
}

}