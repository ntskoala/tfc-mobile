import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {TranslateService} from 'ng2-translate/ng2-translate';
/*
  Generated class for the Config page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-config',
  templateUrl: 'config.html'
})
export class Config {
public lang:string;
public email:string;

  constructor(public navCtrl: NavController, public translate: TranslateService) {
    this.lang = localStorage.getItem("lang");
   // this.email= localStorage.getItem("email");
  }

  ionViewDidLoad() {
    console.log('Hello Config Page');
  }

selectlang(){
//  alert ("idioma" + this.lang);
  localStorage.setItem("lang",this.lang);
  this.translate.use(this.lang);
  this.translate.setDefaultLang(this.lang);
}

setmail(){
//alert (this.email);
//localStorage.setItem("email",this.email);
}


}
