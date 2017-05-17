let server = 'http://tfc.proacciona.es/'; //prod
//let server = 'http://tfc.ntskoala.com/';//DESARROLLO
let base = server + 'api/';

export const URLS = {
  BASE : base,
  LOGIN: base + 'actions/login.php',
  UPLOAD_DOCS: base + 'uploads.php',
  STD_ITEM: base + 'std_item.php',
  STD_SUBITEM: base + 'std_subitem.php',
  //**********TRAZABILIDAD */
  TRAZA_ORDENES:  base + 'traza_ordenes.php',
  UPDATE_REMANENTE: base+ 'update_remanente.php',

  UPLOAD_LOGO: base + 'logoempresa.php',
  FOTOS: server +'controles/',
  LOGOS: server + 'logos/',
  DOCS: server + 'docs/'
}

export class Almacen {
  constructor(
    public id: number,
    public idempresa:number,
    public nombre:string,
    public capacidad: number,
    public estado: number,
    public idproduccionordenactual: number,
    public level?: number
  ) {}
}

export class ProduccionDetalle {
  constructor(
    public id: number,  
    public idorden: number,
    public proveedor:string,
    public producto:string,
    public numlote_proveedor:string,
    public idmateriaprima: number,
    public idloteinterno: number,
    public cantidad: number,
    public tipo_medida: string,
){}
}
export class ProduccionOrden {
  constructor(
    public id: number,  
    public 	idempresa: number,
    public numlote: string,
    public fecha_inicio: Date,
    public fecha_fin: Date,
    public fecha_caducidad?: Date,
    public responsable?: string,
    public cantidad?: number,
    public remanente?: number,
    public tipo_medida?: string,
    public idproductopropio?: number,
    public nombre?: string,
    public familia?: string,
    public estado?: string,
    public idalmacen?: number,
    public idcliente?: number
){}
}
export class Cliente {
  constructor(
    public nombre: string,
    public idEmpresa: number,
    public contacto?: string,
    public telf?: string,
    public email?: string,
    public id?: number
  ) {}
}
export class Distribucion {
  constructor(
    public id: number,
    public idempresa: number,   
    public idcliente: number,
    public idproductopropio: number,
    public idordenproduccion: number,
    public numlote: string,
    public fecha:Date,
    public fecha_caducidad:Date,
    public responsable: string,
    public cantidad: number,
    public tipo_medida: string,
    public alergenos: string
  ) {}
}
export class FamiliasProducto {
  constructor(
    public nombre: string,
    public idempresa: number,
    public nivel_destino?: number,
    public id?: number,

  ) {}
}
export class ProveedorLoteProducto {
  constructor(
    public numlote_proveedor: string,
    public fecha_entrada: Date,
    public fecha_caducidad: Date,
    public cantidad_inicial: number,
    public tipo_medida:string,
    public cantidad_remanente:number,
    public doc: string,
    public idproducto: number,
    public idproveedor: number,
    public idempresa: number,
    public id?: number
  ) {}
}