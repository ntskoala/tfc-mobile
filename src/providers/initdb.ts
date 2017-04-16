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
            localStorage.getItem("idempresa") === null ? console.log("no hay idempresa"): this.sincronizate();
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
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoscontrol',[]);
  //*** ATENCION fecha DATETIME DEFAULT CURRENT_TIMESTAMP ES UTC, una hora menos que en españa. se compensa en los informes de backoffice
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoscontrol (id INTEGER PRIMARY KEY AUTOINCREMENT, idcontrol INTEGER, resultado INTEGER, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, foto BLOB, idusuario INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED CONTROLES-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoschecklist',[]);
  //*** ATENCION fecha DATETIME DEFAULT CURRENT_TIMESTAMP ES UTC, una hora menos que en españa. se compensa en los informes de backoffice
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoschecklist (idlocal INTEGER PRIMARY KEY AUTOINCREMENT, idchecklist INTEGER, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, foto BLOB, idusuario INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED CONTROLES-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
  //this.db.executeSql('DROP TABLE IF EXISTS resultadoscontroleschecklist',[]);
     db2.executeSql('CREATE TABLE IF NOT EXISTS resultadoscontroleschecklist (id INTEGER PRIMARY KEY AUTOINCREMENT, idcontrolchecklist INTEGER, idchecklist INTEGER, resultado TEXT, descripcion TEXT, fotocontrol BLOB, fecha DATETIME DEFAULT CURRENT_TIMESTAMP, idresultadochecklist INTEGER)',[]).then((data) => {
            console.log("TABLE CREATED CONTROLES-> " + JSON.stringify(data));
        }, (error) => {
            console.log("ERROR -> " + JSON.stringify(error));
  });
        });

if (localStorage.getItem("synccontrol") === null) {localStorage.setItem("synccontrol","0")}
if (localStorage.getItem("syncchecklist") === null) {localStorage.setItem("syncchecklist","0")}


//db.close();
  //this.sync.sincronizate();
 //  this.logins.forEach (user => this.save(user));
 //  this.getData();
 }


//   getData() {
//    // return this.storage.get('todo');  
//                   let db= new SQLite();
//                   db.openDatabase({name: 'data.db',location: 'default'})
//                   .then(() => { db.executeSql('select * from logins',[]).then((response) => {
// alert(response);
// }); });



  sincronizate(){
     
      console.log("llamada sincronizando");
   //USUARIOS
   //USUARIOS
   // DESCARGA USUARIOS ENTONCES BORRA LOS LOCALES, LUEGO INSERTA LOS DESCARGADOS EN LOCAL.
            this.sync.getMisUsers().subscribe(
            data => {
               this.users = JSON.parse(data.json());
                if (this.users.success){
                    this.users = this.users.data;
                    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
                            db2.executeSql("delete from logins",[]).then((data) => {
                            console.log("delete from logins->" + JSON.stringify(data));
                            }, (error) => {
                            console.log("ERROR -> " + JSON.stringify(error.err));
                            } );
                    });
                    this.users.forEach (user => this.save(user));
                        }
        },
            err => console.error(err),
            () => console.log('getUsuarios completed')
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
            () => console.log('getGerentes completed')
        );  
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
    this.db.create({name: "data.db", location: "default"}).then((db2: SQLiteObject) => {
    return db2.executeSql('select * from logins WHERE user = ? AND password = ?',[nombre,password]).then((data) => {
        if (data.rows.length >0){
            //alert ("id" + data.rows.item(0).id);
            this.logged = data.rows.item(0).id;
           // alert ("logged" + this.logged);
            sessionStorage.setItem("login",data.rows.item(0).id);
            //localStorage.setItem("idempresa",data.rows.item(0).idempresa);
            return true;
            }
        else{
            this.logged = undefined;
            return false;
        }
    }, (error) => {
                alert("ERROR executing -> " + JSON.stringify(error));
                return false;
            });
    });
    }

}