import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';

import { URLS, Almacen } from '../../models/models'

/**
 * Generated class for the Tanques page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-tanques',
  templateUrl: 'tanques.html',
})
export class TanquesPage {
public almacenes;
  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService,) {
                this.translate.use(localStorage.getItem("lang"));
          this.translate.setDefaultLang(localStorage.getItem("lang"));
  }

  ionViewDidLoad() {
  //  console.log(this.navParams.get("almacenes"));
  //  console.log(this.navParams.get("almacenesOrigen"));
  //  console.log(this.navParams.data);
    this.almacenes = this.navParams.get("almacenes");
    //this.almacenes = [1,2,3,4,5]
  }



}
