import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { Initdb } from '../../providers/initdb';
import {TranslateService} from 'ng2-translate';
import {Sync} from '../../providers/sync'


/*
  Generated class for the Empresa page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-empresa',
  templateUrl: 'empresa.html'
})
export class Empresa {
public empresa:number;
public koala: boolean=false;
public debug: boolean = false;
public loader: any;
  constructor(public navCtrl: NavController,public viewCtrl: ViewController, public initdb: Initdb, public sync: Sync,public translate: TranslateService,public loadingCtrl: LoadingController) {}

  ionViewDidLoad() {
    console.log('Hello Empresa Page');
   // if (sessionStorage.getItem("idusuario")=="koala") this.koala = true;
    console.log("koala",this.koala);
  }
setEmpresa(){
  console.log("es debug",this.debug);
if (this.debug) {
 // this.sync.baseurl = 'http://tfc.ntskoala.com/api';
 // localStorage.setItem("modo","debug");
}
else
{
 // this.sync.baseurl = 'http://tfc.proacciona.es/api';
  localStorage.setItem("modo","prod");
}

if (!isNaN(this.empresa)){
  let id = this.empresa.toString();
  let control1 = id.substring(0,2);
  let control2 = id.substring(id.length -2);
    if (control1 == '24' && control2 == '53'){
      let codigo = id.substring(2,id.length -2);
      localStorage.setItem("idempresa",codigo);
      this.presentLoading();
      this.initdb.sincronizate().then(
        (data)=>{
          this.closeLoading();
        },
        (error)=>{
          this.closeLoading();
          alert('error actualizando usuarios, vuelve a intentarlo. Prueba estirando hacia abajo');
        }
      );
     
     // this.navCtrl.pop();
      //this.viewCtrl.dismiss(codigo);
      this.dismiss();
    }
    else //CODIGO ERRONEO
    {
          this.translate.get("empresa.errorcodigo")
    .subscribe(resultado => { alert(resultado);});
    }
  }
 else // NO HAY UN NUMERO EN RESULTADO
  {
    this.translate.get("alertas.errorvalor")
    .subscribe(resultado => { alert(resultado);});
   } 
}
dismiss(){
this.navCtrl.pop();
//this.viewCtrl.dismiss()
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
  closeLoading(){
    console.log('##CLOSE LOADING');
   setTimeout(() => {
      console.log('Async operation has ended');
      this.loader.dismiss()
    }, 1000);
  }

}
