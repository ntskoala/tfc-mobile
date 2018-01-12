import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import * as moment from 'moment'; 
/*
  Generated class for the PeriodosProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class PeriodosProvider {

  constructor(public http: Http) {
    console.log('Hello PeriodosProvider Provider');
  }

  nuevaFecha(periodicidad, fecha_prevista, completarFechas?){
    //periodicidad = JSON.parse(periodicidad)
    let hoy = new Date();
    let proximaFecha;
    console.log('****PERIODICIDAD###',periodicidad.repeticion)

    switch (periodicidad.repeticion){
      case "por uso":
      proximaFecha = hoy;
      break;
      case "diaria":
      proximaFecha = this.nextWeekDay(periodicidad,fecha_prevista);
      if (!completarFechas){
        while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
        fecha_prevista = proximaFecha;
        proximaFecha = this.nextWeekDay(periodicidad,fecha_prevista);
        }
        }
      break;
      case "semanal":
      proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
      if (!completarFechas){
      while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
      fecha_prevista = proximaFecha;
      proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
      }
      }
      break;
      case "mensual":
      if (periodicidad.tipo == "diames"){
          proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M");
          if (!completarFechas){
            while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
            fecha_prevista = proximaFecha;
            proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M");
            }
            }
      } else{
        proximaFecha = this.nextMonthDay(fecha_prevista,periodicidad);
        if (!completarFechas){
          while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
          fecha_prevista = proximaFecha;
          proximaFecha = this.nextMonthDay(fecha_prevista,periodicidad);
          }
          }        
      }

      break;
      case "anual":
      if (periodicidad.tipo == "diames"){
        let año = moment(fecha_prevista).get('year') + periodicidad.frecuencia;
      proximaFecha = moment().set({"year":año,"month":parseInt(periodicidad.mes)-1,"date":periodicidad.numdia});
      if (!completarFechas){
        while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
        fecha_prevista = proximaFecha;
        let año = moment(fecha_prevista).get('year') + periodicidad.frecuencia;
        proximaFecha = moment().set({"year":año,"month":parseInt(periodicidad.mes)-1,"date":periodicidad.numdia});
        }
        }
      } else{
        proximaFecha = this.nextYearDay(fecha_prevista,periodicidad);
        if (!completarFechas){
          while (moment(proximaFecha).isSameOrBefore(moment(),'day')){
          fecha_prevista = proximaFecha;
          proximaFecha = this.nextYearDay(fecha_prevista,periodicidad);
          }
          }
      }
      break;
    }
    let newdate;
    newdate = moment(proximaFecha).toDate();
    return newdate = new Date(Date.UTC(newdate.getFullYear(), newdate.getMonth(), newdate.getDate()))
}


nextWeekDay(periodicidad:any, fecha?:Date) {
let hoy = new Date();
if (fecha) hoy = new Date(fecha);

let proximoDia:number =-1;
let nextFecha;
for(let currentDay= hoy.getDay();currentDay<6;currentDay++){
  if (periodicidad.dias[currentDay].checked == true){
    proximoDia = 7 + currentDay - (hoy.getDay()-1);
    break;
  }
}
console.log(fecha,proximoDia);
if (proximoDia ==-1){
    for(let currentDay= 0;currentDay<hoy.getDay();currentDay++){
  if (periodicidad.dias[currentDay].checked == true){
    proximoDia = currentDay + 7 - (hoy.getDay()-1);
    break;
  }
}
}

if(proximoDia >7) proximoDia =proximoDia-7;
nextFecha = moment(fecha).add(proximoDia,"days");
return nextFecha;
}

nextMonthDay(fecha_prevista_, periodicidad: any){
let  proximafecha;
let fecha_prevista = new Date(fecha_prevista_);
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
nextYearDay(fecha_prevista_, periodicidad: any){
let proximafecha;
let fecha_prevista = new Date(fecha_prevista_);
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

hayRetraso(fechaPrevista,periodicidad):number{
  let retraso:number = 0;
  let periodo;
 // periodicidad = JSON.parse(periodicidad)
  console.log('****PERIODICIDAD_hay retraso??',periodicidad.repeticion)
  switch (periodicidad.repeticion){
    case "diaria":
    periodo = 'days';
    break;
    case "semanal":
    periodo = 'weeks';
    break;
    case "mensual":
    periodo = 'months';
    break;
    case "anual":
    periodo = 'years';
    break;
  }
  console.log('****PERIODICIDAD',moment().diff(moment(fechaPrevista),periodo))
  
  // if (moment().diff(moment(fechaPrevista),periodo)>1){
  //   retraso = true;
  // }

  return (moment().diff(moment(fechaPrevista),periodo));
}
//   nuevaFecha(periodicidad, fecha_prevista){
//     //let periodicidad = JSON.parse(limpieza.periodicidad)
//     let hoy = new Date();
//     let proximaFecha;
//     console.log('****PERIODICIDAD',periodicidad.repeticion)
//     switch (periodicidad.repeticion){
//       case "diaria":
//       proximaFecha = this.nextWeekDay(periodicidad);
//       break;
//       case "semanal":
//       proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
//       while (moment(proximaFecha).isSameOrBefore(moment())){
//       fecha_prevista = proximaFecha;
//       proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"w");
//       }
//       break;
//       case "mensual":
//       if (periodicidad.tipo == "diames"){
//           proximaFecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M");
//       } else{
//         proximaFecha = this.nextMonthDay(fecha_prevista,periodicidad);
//       }

//       break;
//       case "anual":
//       if (periodicidad.tipo == "diames"){
//         let año = moment(fecha_prevista).get('year') + periodicidad.frecuencia;
//       proximaFecha = moment().set({"year":año,"month":parseInt(periodicidad.mes)-1,"date":periodicidad.numdia});
//       } else{
//         proximaFecha = this.nextYearDay(fecha_prevista,periodicidad);
//       }
//       break;
//     }
//     let newdate;
//     newdate = moment(proximaFecha).toDate();
//     return newdate = new Date(Date.UTC(newdate.getFullYear(), newdate.getMonth(), newdate.getDate()))
// }


// nextWeekDay(periodicidad:any, fecha?:Date) {
// let hoy = new Date();
// if (fecha) hoy = fecha;
// let proximoDia:number =-1;
// let nextFecha;
// for(let currentDay= hoy.getDay();currentDay<6;currentDay++){
//   if (periodicidad.dias[currentDay].checked == true){
//     proximoDia = 7 + currentDay - (hoy.getDay()-1);
//     break;
//   }
// }
// if (proximoDia ==-1){
//     for(let currentDay= 0;currentDay<hoy.getDay();currentDay++){
//   if (periodicidad.dias[currentDay].checked == true){
//     proximoDia = currentDay + 7 - (hoy.getDay()-1);
//     break;
//   }
// }
// }
// if(proximoDia >7) proximoDia =proximoDia-7;
// nextFecha = moment().add(proximoDia,"days");
// return nextFecha;
// }

// nextMonthDay(fecha_prevista_, periodicidad: any){
// let  proximafecha;
// let fecha_prevista = new Date(fecha_prevista_);
// let mes = fecha_prevista.getMonth() +1 + periodicidad.frecuencia;

// if (periodicidad.numsemana ==5){
// let ultimodia =  moment(fecha_prevista).add(periodicidad.frecuencia,"M").endOf('month').isoWeekday() - periodicidad.nomdia;
// proximafecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M").endOf('month').subtract(ultimodia,"days");
// }else{
// let primerdia = 7 - ((moment(fecha_prevista).add(periodicidad.frecuencia,"M").startOf('month').isoWeekday()) - periodicidad.nomdia)
// if (primerdia >6) primerdia= primerdia-7;
// proximafecha = moment(fecha_prevista).add(periodicidad.frecuencia,"M").startOf('month').add(primerdia,"days").add(periodicidad.numsemana-1,"w");
// }
// return  proximafecha;
// }
// nextYearDay(fecha_prevista_, periodicidad: any){
// let proximafecha;
// let fecha_prevista = new Date(fecha_prevista_);
// let mes = parseInt(periodicidad.mes) -1;
// fecha_prevista = moment(fecha_prevista).month(mes).add(periodicidad.frecuencia,'y').toDate();

// if (periodicidad.numsemana ==5){
// let ultimodia =  moment(fecha_prevista).endOf('month').isoWeekday() - periodicidad.nomdia;
// proximafecha = moment(fecha_prevista).endOf('month').subtract(ultimodia,"days");
// }else{
// let primerdia = 7 - ((moment(fecha_prevista).startOf('month').isoWeekday()) - periodicidad.nomdia)
// if (primerdia >6) primerdia= primerdia-7;
// proximafecha = moment(fecha_prevista).startOf('month').add(primerdia,"days").add(periodicidad.numsemana-1,"w");
// }
// return proximafecha;
// }




}
