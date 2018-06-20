import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PopoverController } from 'ionic-angular';
import {Servidor} from '../../providers/servidor';
import { HomePage } from '../home/home'
import { Config } from '../config/config'
import { TanquesPage } from '../tanques/tanques'
import { Network } from '@ionic-native/network';

import { TranslateService } from 'ng2-translate';
import * as moment from 'moment/moment';
/**
 * Generated class for the Traspasos page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

import { URLS, Almacen, ProduccionDetalle, ProduccionOrden, ProveedorLoteProducto, FamiliasProducto, Cliente, Distribucion } from '../../models/models'



@IonicPage()
@Component({
  selector: 'page-traspasos',
  templateUrl: 'traspasos.html',
  providers: [Servidor],
})
export class TraspasosPage {
//*** STANDARD VAR

//public itemActivo: number;
//public items: ProduccionOrden[]=[];
public nuevaOrden: ProduccionOrden = new ProduccionOrden(0,0,'',new Date,new Date);
public  ordenOrigen: ProduccionOrden;
public  ordenDestino: ProduccionOrden;
public nuevoDetalleOrden_Origen:  ProduccionDetalle = new ProduccionDetalle(0,0,'','','',0,0,0,'');
public nuevoDetalleOrden_Destino:  ProduccionDetalle = new ProduccionDetalle(0,0,'','','',0,0,0,'');
public passItem: ProduccionDetalle;


public estado:string='abierto';
//*** ESPECIFIC VAR */
public traspaso:boolean=false;
public almacenes: any;
private almacenesOrigen: Almacen[];
private almacenOrigenSelected: Almacen;
private almacenesDestino: Almacen[];
private almacenDestinoSelected: Almacen;
private level:number;
private idAlmacenDestino: number;
private cantidadTraspaso: number;
public productos: any[]=[];
public proveedores: any[]=[];
public clientes: Cliente[]=[];
public familias: FamiliasProducto[]=[];
public clienteSelected:Cliente;
public distribucion:Distribucion;
public entrada_productos: any[]=[];
public proveedor:boolean=false;
public idProveedorActual:number;
public idProductoActual:number;
public loteSelected:ProveedorLoteProducto;
public max_cantidad:number=70;
public contador:number;
public alerts:string[]=[];

//***** */
public numTanque:number;
public ok:boolean=true;
public ok2:boolean=false;
public translateTanque:string="Tanque";
public translateCliente:string="Cliente";
//***** */
public idempresa= localStorage.getItem("idempresa");
public userId= sessionStorage.getItem("login");


  constructor(public navCtrl: NavController, public navParams: NavParams, public servidor: Servidor, 
    private translate: TranslateService, public popoverCtrl: PopoverController, public network:Network) {
            this.translate.use(localStorage.getItem("lang"));
          this.translate.setDefaultLang(localStorage.getItem("lang"));
}

  ionViewDidLoad() {
    console.debug('ionViewDidLoad Traspasos');
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

  ngOnInit() {
    console.log('START LOADING TRASPASOS...')
    this.translate.get('traspasos.Tanque').subscribe((valor) => this.translateTanque=valor);
    this.translate.get('traspasos.Cliente').subscribe((valor) => this.translateCliente=valor);
    if (this.isTokenExired(localStorage.getItem('token')) && this.network.type != 'none'){
        let param = '?user=' + sessionStorage.getItem("nombre") + '&password=' +sessionStorage.getItem("password");
        this.servidor.login(URLS.LOGIN, param).subscribe(
          response => {
            if (response.success == 'true') {
              // Guarda token en sessionStorage
              localStorage.setItem('token', response.token);
              this.preLoad();
              }
              });
      }else{
          this.preLoad();
      }
  }

preLoad(){
    if(!this.userId) this.userId = '1';
    this.getAlmacenes();
    this.getProveedores();
    //this.getClientes();
    this.getFamilias();
}
getOrden(idorden:number,fuente:string) {
    let parametros = '&idempresa=' + this.idempresa+"&entidad=produccion_orden&WHERE=id=&valor="+idorden+"";
        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                  console.debug(response.data);
                 // if (response.data.length==1){
                      if (fuente=="origen"){
                        this.ordenOrigen = new ProduccionOrden(element.id,element.idempresa,element.numlote,new Date(element.fecha_inicio),new Date(element.fecha_fin),new Date(element.fecha_caducidad),element.responsable,element.cantidad,element.tipo_medida,element.nombre,element.familia,element.estado);
                        console.debug("origen",fuente,this.ordenOrigen)
                      }else{
                          this.ordenDestino = new ProduccionOrden(element.id,element.idempresa,element.numlote,new Date(element.fecha_inicio),new Date(element.fecha_fin),new Date(element.fecha_caducidad),element.responsable,element.cantidad,element.tipo_medida,element.nombre,element.familia,element.estado);
                    }
                //}
                }
            }
        });
   }


getAlmacenes() {
    
    let parametros = '&idempresa=' + this.idempresa+"&entidad=almacenes";

        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            //this.itemActivo = 0;
            // Vaciar la lista actual
            this.almacenesOrigen = [];
           // this.almacenesOrigen.push(new Almacen(0,0,'Selecciona',0,0,0));
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                this.almacenesOrigen.push(new Almacen(element.id,element.idempresa,element.nombre,element.capacidad,element.estado,element.idproduccionordenactual,element.level));
              }
             // this.listaZonas.emit(this.limpiezas);
            }
        },
        (error)=>console.debug(error),
        ()=>{
            this.almacenes = this.almacenesOrigen;
        });
   }

   getClientes() {
    let parametros = '&idempresa=' + this.idempresa+"&entidad=clientes";
    let tanque;
        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            this.clientes = [];
            this.clientes.push(new Cliente(this.translateTanque,0,'','','',0));
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                this.clientes.push(new Cliente(element.nombre,element.idempresa,element.contacto,element.telf,element.email,element.id));
              }
             // this.listaZonas.emit(this.limpiezas);
            }
        });
   }
   getFamilias() {
    let parametros = '&idempresa=' + this.idempresa+"&entidad=proveedores_familia";

        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            this.familias = [];
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                this.familias.push(new FamiliasProducto(element.nombre,element.idempresa,element.nivel_destino,element.id));
              }
             // this.listaZonas.emit(this.limpiezas);
            }
        });
   }
getProveedores(){
         let parametros = '&idempresa=' + this.idempresa+"&entidad=proveedores"; 
        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            this.proveedores = [];
            //this.proveedores.push({"id":0,"nombre":"selecciona"});
            this.proveedores.push({"id":0,"nombre":this.translateTanque});
            if (response.success && response.data) {
              for (let element of response.data) { 
                  this.proveedores.push({"id":element.id,"nombre":element.nombre});
             }
            }
        },
        error=>console.debug(error),
        ()=>{}
        ); 
}

getProductos(idProveedor:number){
    console.debug("id",idProveedor);

    (idProveedor >0)? this.proveedor = true: this.proveedor=false;
    this.cambioOrigen();
    this.idProveedorActual = idProveedor;
         let parametros = '&idempresa=' + this.idempresa+"&entidad=proveedores_productos&field=idproveedor&idItem="+idProveedor; 
        this.servidor.getObjects(URLS.STD_SUBITEM, parametros).subscribe(
          response => {
            this.productos = [];
           // this.productos.push({"id":0,"nombre":'selecciona',"familia":0});
            if (response.success && response.data) {
              for (let element of response.data) { 
                  this.productos.push({"id":element.id,"nombre":element.nombre,"familia":element.idfamilia});
             }
            }
        },
        error=>console.debug(error),
        ()=>{}
        ); 
}

getEntradasProducto(idProducto){
 let filtro_inicio = moment(new Date()).format('YYYY-MM-DD').toString();
 let filtro_fin = moment(new Date ()).format('YYYY-MM-DD').toString();
  let filtro_dates = "&filterdates=true&fecha_field=fecha_entrada&fecha_inicio="+ filtro_inicio +  "&fecha_fin="+filtro_fin;

        this.idProductoActual = idProducto;
        console.debug('entradasproducto',idProducto)
         let parametros = '&idempresa=' + this.idempresa+"&entidad=proveedores_entradas_producto&field=idproducto&idItem="+idProducto+filtro_dates; 
        this.servidor.getObjects(URLS.STD_SUBITEM, parametros).subscribe(
          response => {
            this.entrada_productos = [];
            this.entrada_productos.push(new ProveedorLoteProducto('nueva entrada',new Date(),new Date(),0,'l.',0,'',idProducto,this.idProveedorActual,parseInt(localStorage.getItem("idempresa"))));
            //this.entrada_productos.push(new ProveedorLoteProducto('selecciona',new Date(),new Date(),0,'',0,'',0,0,0,0));
            if (response.success && response.data) {
              for (let element of response.data) { 
                  this.entrada_productos.push(new ProveedorLoteProducto(element.numlote_proveedor,element.fecha_entrada,element.fecha_caducidad,element.cantidad_inicial,element.tipo_medida,element.cantidad_remanente,element.doc,element.idproducto,element.idproveedor,element.idempresa,element.id));
             }
            }
        },
        error=>console.debug(error),
        ()=>{}
        ); 
}

seleccionarOrigen(origen: string,valor: number){
        this.clientes = [];
        this.clientes.push(new Cliente(this.translateTanque,0,'','','',0));
    if (origen=="interno"){
  this.level = this.almacenesOrigen[valor].level;
  if (this.level >= 2) this.getClientes();
  this.almacenesDestino = this.almacenesOrigen.filter((almacen) => (almacen.level >= this.level));
  this.level++;
  this.almacenesDestino = this.almacenesDestino.filter((almacen) => (almacen.level <= this.level));
  this.almacenOrigenSelected = this.almacenesOrigen[valor];
        if (this.almacenOrigenSelected.idproduccionordenactual > 0){
        this.getOrden(this.almacenOrigenSelected.idproduccionordenactual,"origen")
        }else{
            this.ordenOrigen = null;
        }
    }else{
        //***********SELECCIONAR LEVEL DESTINO CUANDO ORIGEN = LOTE PROVEEDOR */
        let indiceProducto = this.productos.findIndex((prod) => prod.id == this.idProductoActual);
        let indiceFamilia = this.familias.findIndex((fam) => fam.id == this.productos[indiceProducto].familia);
        if (indiceFamilia<0){
            this.level = 1;
        }else{
        this.level = this.familias[indiceFamilia].nivel_destino;
    }
        if (this.level<3){
         this.almacenesDestino = this.almacenesOrigen.filter((almacen) => (almacen.level >= this.level));
         this.almacenesDestino = this.almacenesDestino.filter((almacen) => (almacen.level <= this.level));
        }else{
         this.almacenesDestino = this.almacenesOrigen;
        }    
         this.loteSelected = this.entrada_productos[valor];
         //}
    }
    //console.debug(this.ordenOrigen)
    //this.almacenesDestino.splice(0,0,new Almacen(0,0,'Selecciona',0,0,0));
}

seleccionarDestino(valor:number){
    this.almacenDestinoSelected = this.almacenesDestino[valor];
    if (this.almacenDestinoSelected.idproduccionordenactual > 0){
    this.getOrden(this.almacenDestinoSelected.idproduccionordenactual,"destino");
    console.debug(this.ordenDestino)
    }else{
        this.ordenDestino = null;
    }
}

traspasar(){
this.ok=false;
    //console.debug(this.controlarOrigen() , this.controlarDestino());
    if (this.controlarOrigen() && this.controlarDestino()){

    console.debug('traspaso_ordenOrigen',this.ordenOrigen)
    console.debug('traspaso_ordenDestino',this.ordenDestino)
    if (this.almacenOrigenSelected){
    //Comprobar cantidad de traspaso <= al disponible en origen this.almacenOrigenSelected.estado
    ////Comprobar cantidad de traspaso <= a la capacidad disponible en destino this.almacenDestinoSelected.capacidad . this.almacenDestinoSelected.estado
     this.setNewOrdenProduccion();
//    console.debug('restar de orden:' + this.ordenOrigen.id + "y de tanque" + this.almacenOrigenSelected.id);
//    console.debug('añadir a orden nueva orden:' + this.ordenOrigen.id +"y" +this.ordenDestino.id + "y sumar cantidad a tanque" + this.almacenDestinoSelected.id);
//    console.debug('poner en tanque' + this.almacenDestinoSelected.id + "el nuevo id generado de la nueva orden");
//    console.debug('si destino == tanque p, poner fecha caducidad = fecha_inicio(del lote nuevo) + 7 días');
    }
    else if (this.loteSelected){
        if (this.loteSelected.numlote_proveedor == 'nueva entrada'){
            this.setNuevaEntradaProveedor();
        }else{
        this.setNewOrdenProduccion();
        }
    }
}

}
setNuevaEntradaProveedor(){
    let contadorP=0;
//let nuevoItem: ProveedorLoteProducto = new ProveedorLoteProducto('',new Date(),new Date(),null,'',0,'',null,0,0,0);
    let parametros = '&idempresa=' + this.idempresa+"&entidad=proveedores_entradas_producto"+"&field=idproveedor&idItem="+this.loteSelected.idproveedor+"&WHERE=fecha_entrada=curdate()";
        this.servidor.getObjects(URLS.STD_SUBITEM, parametros).subscribe(
          response => {
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                      contadorP++;
                }
            }
        },
    error =>{
        console.debug(error);
        this.errorEn('Calculando num lote');
        },
        ()=>{
let param = "&entidad=proveedores_entradas_producto"+"&field=idproveedor&idItem="+this.loteSelected.idproveedor;
   let fecha = new Date();
    this.loteSelected.numlote_proveedor = "P"+fecha.getDate() + "/"+ (+fecha.getMonth() + +1)+"/"+fecha.getFullYear()+"-"+contadorP;
    this.loteSelected.cantidad_inicial =  this.cantidadTraspaso;
    this.loteSelected.cantidad_remanente = this.cantidadTraspaso;
    this.loteSelected.fecha_caducidad = moment().add(7,'days').toDate();
    this.servidor.postObject(URLS.STD_ITEM, this.loteSelected,param).subscribe(
      response => {
        if (response.success) {
          //this.items.push(this.nuevoItem);
          //this.items[this.items.length-1].id= response.id;
          this.loteSelected.id = response.id;
          this.setNewOrdenProduccion();
        }
    },
    error =>console.debug("Error en nueva entrada producto",error),
    () =>console.debug('entrada producto ok')
    );
        });
}

//crear Nueva Orden de Producción ojo (si loteSelected or si almacenOrigenSelected)
//si almacenOrigenSelected --> Orden del almacenOrigenSelected
setNewOrdenProduccion(ordenFuente?: ProduccionOrden){
    this.contador= 0;
    let contadorF=0;
    if (this.almacenDestinoSelected){
        this.nuevaOrden.cantidad=+this.almacenDestinoSelected.estado + +this.cantidadTraspaso;
        this.nuevaOrden.idalmacen = this.almacenDestinoSelected.id;
        console.debug("Destino",this.almacenDestinoSelected);
        if (this.almacenDestinoSelected.level > 1){
            if(this.almacenOrigenSelected){
            // if (this.almacenOrigenSelected.level<=1){
            //     this.nuevaOrden.fecha_caducidad = moment().add(7,'days').toDate();
            // }else{
                console.debug('Almacen destino > 1 y almacen origen level >1 = '+this.almacenOrigenSelected.level+' y ...');
                let caducidad;
                if (this.ordenDestino){
                 caducidad = (moment(this.ordenOrigen.fecha_caducidad)<moment(this.ordenDestino.fecha_caducidad))?this.ordenOrigen.fecha_caducidad:this.ordenDestino.fecha_caducidad;
                }else{
                    //  caducidad = this.ordenOrigen.fecha_caducidad;
                     caducidad = moment().add(7,'days').toDate();
                }        
                    console.debug(caducidad);
                    this.nuevaOrden.fecha_caducidad = caducidad;
            // }
            }else if (this.loteSelected){
                if (this.ordenDestino)
                {
                let caducidad = (moment(this.loteSelected.fecha_caducidad)<moment(this.ordenDestino.fecha_caducidad))?this.loteSelected.fecha_caducidad:this.ordenDestino.fecha_caducidad;
                    console.debug(caducidad);
                    this.nuevaOrden.fecha_caducidad = caducidad;
                }else{
                    this.nuevaOrden.fecha_caducidad = moment().add(7,'days').toDate();
                }
            }
        }
    }else{
        this.nuevaOrden.cantidad= this.cantidadTraspaso;
        this.nuevaOrden.idalmacen = 0;
        this.nuevaOrden.idcliente = this.clienteSelected.id;
    }
this.nuevaOrden.idempresa = parseInt(this.idempresa);
let fecha= new Date();
this.nuevaOrden.fecha_inicio = fecha;
this.nuevaOrden.fecha_fin = fecha;
this.nuevaOrden.responsable = this.userId;
this.nuevaOrden.remanente = this.nuevaOrden.cantidad;
this.nuevaOrden.tipo_medida = "l.";

//buscamos las ordenes de produccion de la empresa actual, que tengan como fecha_inicio "creacion", igual a hoy, incremento contador para cada registro
//Cuando termina, actualizazo el valor de numlote de la nuevaOrden, y creo la orden.
    let parametros = '&idempresa=' + this.idempresa+"&entidad=produccion_orden&WHERE=fecha_inicio=curdate()%2B&valor=";
        this.servidor.getObjects(URLS.STD_ITEM, parametros).subscribe(
          response => {
            if (response.success == 'true' && response.data) {
              for (let element of response.data) {
                  if (element.numlote.substr(0,1)=='F'){
                      contadorF++;
                  }else{
                  this.contador++;
                  }
                }
            }
        },
    error =>{
        console.debug(error);
        this.errorEn('Calculando num lote');
        },
        ()=>{
            if (this.clienteSelected){
            this.nuevaOrden.numlote = "F"+fecha.getDate() + "/"+ (+fecha.getMonth() + +1)+"/"+fecha.getFullYear()+"-"+contadorF;
            this.nuevaOrden.fecha_caducidad = this.ordenOrigen.fecha_caducidad;
            this.nuevaOrden.estado = 'entregado';
              this.distribucion = new Distribucion(0,parseInt(this.idempresa),this.clienteSelected.id,0,0,this.nuevaOrden.numlote,new Date(),this.nuevaOrden.fecha_caducidad,this.userId,this.nuevaOrden.cantidad,'L','alergenos');

//            this.setNewClienteDistribucion(this.distribucion);
            }else{
            this.nuevaOrden.numlote = fecha.getDate() + "/"+ (+fecha.getMonth() + +1)+"/"+fecha.getFullYear()+"-"+this.contador;
            this.nuevaOrden.estado = 'cerrado';
            //if (this.nuevaOrden.fecha_caducidad === null) this.nuevaOrden.fecha_caducidad = this.ordenOrigen.fecha_caducidad;
            }

this.nuevaOrden.nombre = this.nuevaOrden.numlote;
let param = "&entidad=produccion_orden";
    this.servidor.postObject(URLS.STD_ITEM, this.nuevaOrden,param).subscribe(
      response => {
        if (response.success) {
          this.nuevaOrden.id = response.id;
          //this.items.push(this.nuevoItem);
          this.prepareNewOrdenProduccionDetalle(response.id);
          this.nuevaOrden = new ProduccionOrden(0,0,'',new Date(),new Date());
        }
    },
    error =>{
        console.debug(error);
        this.errorEn('setNewOrdenProduccionDetalle');
    },
    ()=>{}    
    );
    });
}
///De lote o Orden en Origen
prepareNewOrdenProduccionDetalle(idOrden: number){
   
    this.nuevoDetalleOrden_Origen.id =0;
    this.nuevoDetalleOrden_Origen.idorden = idOrden;

    this.nuevoDetalleOrden_Origen.cantidad = this.cantidadTraspaso;
    if (this.proveedor){
    this.nuevoDetalleOrden_Origen.idmateriaprima = this.loteSelected.id;
    this.nuevoDetalleOrden_Origen.idloteinterno = 0;
    this.nuevoDetalleOrden_Origen.numlote_proveedor = this.loteSelected.numlote_proveedor;
    this.nuevoDetalleOrden_Origen.proveedor = this.proveedores[this.proveedores.findIndex((prov)=>prov.id==this.idProveedorActual)].nombre;
    this.nuevoDetalleOrden_Origen.producto = this.productos[this.productos.findIndex((prod)=>prod.id==this.idProductoActual)].nombre;
    this.nuevoDetalleOrden_Origen.cantidad_remanente_origen = this.loteSelected.cantidad_remanente- this.cantidadTraspaso;    
    this.nuevoDetalleOrden_Origen.cantidad_real_origen = this.loteSelected.cantidad_remanente;   
    }
    if (!this.proveedor){
     this.nuevoDetalleOrden_Origen.idloteinterno = this.ordenOrigen.id;
    this.nuevoDetalleOrden_Origen.idmateriaprima = 0;
    this.nuevoDetalleOrden_Origen.proveedor = 'interno';
    this.nuevoDetalleOrden_Origen.producto = 'lote int ' + this.ordenOrigen.numlote;
    this.nuevoDetalleOrden_Origen.cantidad_remanente_origen = this.almacenOrigenSelected.estado - this.cantidadTraspaso;        
    this.nuevoDetalleOrden_Origen.cantidad_real_origen = this.almacenOrigenSelected.estado;   
    }
    console.debug('origen');
    this.setNewOrdenProduccionDetalle(idOrden,this.nuevoDetalleOrden_Origen,'origen');
    
    if (this.almacenDestinoSelected){
    if (+this.almacenDestinoSelected.idproduccionordenactual > 0){
        console.debug('destino',+this.almacenDestinoSelected.idproduccionordenactual);
    this.nuevoDetalleOrden_Destino.id =0;
    this.nuevoDetalleOrden_Destino.idorden = idOrden;
    this.nuevoDetalleOrden_Destino.proveedor = 'Interno';
    this.nuevoDetalleOrden_Destino.producto = 'lote interno';
    this.nuevoDetalleOrden_Destino.idloteinterno = this.almacenDestinoSelected.idproduccionordenactual;
    this.nuevoDetalleOrden_Destino.idmateriaprima = 0;
    this.nuevoDetalleOrden_Destino.cantidad = this.almacenDestinoSelected.estado;
    this.nuevoDetalleOrden_Destino.cantidad_remanente_origen = 0;        
    this.nuevoDetalleOrden_Destino.cantidad_real_origen = this.almacenDestinoSelected.estado;
    this.setNewOrdenProduccionDetalle(idOrden,this.nuevoDetalleOrden_Destino,'destino');
    }}
 this.prepareAlmacenes(idOrden);
}
setNewOrdenProduccionDetalle(idOrden:number, detalleOrden: ProduccionDetalle,fuente:string){
    console.debug('setNewOrdenProduccionDetaalle',detalleOrden);
    //this.passItem = detalleOrden;
    let param = "&entidad=produccion_detalle"+"&field=idorden&idItem="+idOrden;
    this.servidor.postObject(URLS.STD_ITEM, detalleOrden,param).subscribe(
      response => {
        if (response.success) {
            if (fuente=='origen'){
          this.nuevoDetalleOrden_Origen.id = response.id
          this.setRemanente(this.nuevoDetalleOrden_Origen);
            }else{
          this.nuevoDetalleOrden_Destino.id = response.id
          this.setRemanente(this.nuevoDetalleOrden_Destino);
            }
        }
    },
    error =>{
        console.debug(error);
        this.errorEn('setNewOrdenProduccionDetalle ' + fuente);
        },
    () =>{}   
    );
}


prepareAlmacenes(newOrden: number){
    if (!this.clienteSelected){
    this.almacenDestinoSelected.estado = +this.almacenDestinoSelected.estado + +this.cantidadTraspaso;
    this.almacenDestinoSelected.idproduccionordenactual = newOrden;
    this.setAlmacen(this.almacenDestinoSelected);
    this.getOrden(newOrden,"destino");
    }else{
        this.distribucion.idordenproduccion = newOrden;
//        this.distribucion.idproductopropio =
        this.setNewClienteDistribucion(this.distribucion);
        this.getOrden(newOrden,"destino");
    }
    if(this.almacenOrigenSelected){
    this.almacenOrigenSelected.estado = +this.almacenOrigenSelected.estado - +this.cantidadTraspaso;
    if (this.almacenOrigenSelected.estado == 0){
        this.almacenOrigenSelected.idproduccionordenactual = 0;
    }
    this.setAlmacen(this.almacenOrigenSelected);
    this.ordenOrigen = null;
    }else{ 
        //Origen = entrada Proveedor, actualizamos md-card desde this.loteSelected
        this.loteSelected.cantidad_remanente = this.loteSelected.cantidad_remanente -this.cantidadTraspaso;
    }
    this.cantidadTraspaso = null;
    this.ok=true;
    this.ok2=true;
}

setAlmacen(almacen: Almacen){
    let param = '?id=' + almacen.id +   "&entidad=almacenes";
    this.servidor.putObject(URLS.STD_ITEM,param, almacen).subscribe(
      response => {
        if (response.success) {
          //this.passItem.id = response.id
          //this.setRemanente(this.passItem);
        }
    },
    error =>{
        console.debug(error);
        this.errorEn('setAlmacen ' +almacen.nombre);
        },
    () =>{}   
    );
}


setRemanente(detalleProduccion: ProduccionDetalle){
  console.debug("setRemanente",detalleProduccion)
//   if (detalleProduccion.idmateriaprima >0){
        let parametros = '&idempresa=' + this.idempresa+"&idOrden="+detalleProduccion.idloteinterno+"&idmateriaprima="+detalleProduccion.idmateriaprima+"&cantidad="+detalleProduccion.cantidad; 
        this.servidor.getObjects(URLS.UPDATE_REMANENTE, parametros).subscribe(
          response => {
            this.entrada_productos = [];
            if (response.success && response.data) {
              console.debug('updated');
             }
        },
    error =>{
        console.debug(error);
        this.errorEn('setRemanente Materia Prima');
        },
        ()=>{}
        ); 
//   }else{

//   }
}

setNewClienteDistribucion(distribucion: Distribucion ){

    let param = "&entidad=clientes_distribucion";
    this.servidor.postObject(URLS.STD_ITEM, distribucion,param).subscribe(
      response => {
        if (response.success) {
        }
    },
    error =>{
        console.debug(error);
        this.errorEn('setNewClienteDistribucion');
        },
    () =>{}   
    );
}

cambioOrigen(){
    if (this.proveedor){
        this.almacenOrigenSelected = null;
    }
    else{
        this.loteSelected = null;
    }
}

controlarOrigen(){
     if (!this.almacenOrigenSelected && !this.loteSelected){
         this.translate.get('produccion.alert_tanque_origen').subscribe(
             (valor) => this.alerts.push(valor)
         );
     }
    if (isNaN(this.cantidadTraspaso) || this.cantidadTraspaso < 1){
       // alert('Cantidad tiene que ser un número mayor de cero');
       // this.dialog.open('Cantidad tiene que ser un número mayor de cero');
       // this.snackBar.open('Cantidad tiene que ser un número mayor de cero', "Cerrar",{duration: 5000});
         this.translate.get('produccion.alert_cantidad_mayor_cero').subscribe(
             (valor) => this.alerts.push(valor)
         );
        return false;
    }

    if (this.proveedor){
       console.debug (this.cantidadTraspaso,+this.loteSelected.cantidad_remanente,typeof this.cantidadTraspaso, typeof +this.loteSelected.cantidad_remanente, +this.cantidadTraspaso <= +this.loteSelected.cantidad_remanente);
       if( +this.cantidadTraspaso <= +this.loteSelected.cantidad_remanente || this.loteSelected.numlote_proveedor =="nueva entrada"){
           return true;
       }else{
         this.translate.get('produccion.alert_cantidad_menor_disponible_origen').subscribe(
             (valor) => this.alerts.push(valor)
         );
           return false;
       }

    }else if (this.almacenOrigenSelected){
        console.debug( this.cantidadTraspaso <= this.almacenOrigenSelected.estado);
        if ( +this.cantidadTraspaso <= +this.almacenOrigenSelected.estado){
            return true;
        }else{
         this.translate.get('produccion.alert_cantidad_menor_disponible_origen').subscribe(
             (valor) => this.alerts.push(valor)
         );
           return false;
        }
    }
}
controlarDestino(){
    if (this.clienteSelected){
        return true;
    }
        else{
    if (this.almacenDestinoSelected && this.almacenDestinoSelected.id > 0){
        console.debug ((this.almacenDestinoSelected.capacidad - this.almacenDestinoSelected.estado) >= this.cantidadTraspaso);
        if((+this.almacenDestinoSelected.capacidad - +this.almacenDestinoSelected.estado) >= +this.cantidadTraspaso){
            return true;
        }else{
         this.translate.get('produccion.alert_cantidad_menor_disponible_destino').subscribe(
             (valor) => this.alerts.push(valor)
         );
           return false;
        }
    }else{
         this.translate.get('produccion.alert_tanque_destino').subscribe(
             (valor) => this.alerts.push(valor)
         );
        return false;
    }
        }
}
cierraMessage(){
    this.alerts=[];
    this.cantidadTraspaso=null;
    this.ok=true;
}
 
setCliente(id:number){
    console.debug ("idcli",id)
//si es 0 es Tanque, si es mayor es el id de cliente seleccionado
if (id>0){
    let i = this.clientes.findIndex((cli)=>cli.id==id);
    this.clienteSelected = this.clientes[i];
    this.almacenDestinoSelected = null;
}else{
    this.clienteSelected = null;
}

}
errorEn(motivo:string){
alert ("Se ha producido iun corte en el proceso en: " + motivo);
this.ok=true;
}
setok(){
    this.navCtrl.setRoot(HomePage);
}

verTanques(almacenes) {

    //let popover = this.popoverCtrl.create("TanquesPage");
    //popover.present();
    //this.navCtrl.push("TanquesPage",this.almacenesOrigen)
      this.navCtrl.push("TanquesPage", {almacenes: almacenes}).then(
      response => {
        console.debug('Response ' + response);
      },
      error => {
        console.debug('Error: ' + error);
      }
    ).catch(exception => {
      console.debug('Exception ' + exception);
    });
 
  }
}
