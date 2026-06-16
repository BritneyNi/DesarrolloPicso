import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

export interface ResumenEmpleado {
  fecha: string;
  horaEntrada: string;
  horaSalida: string;
  nombreCompleto: string;
  horasTrabajadas: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  trabajoDomingo: boolean;
  trabajoFestivo: boolean;
  ubicacion?: string;
  obra?: string;
  trabajoSabado?: boolean;
  horasDominicales: number;
  horasRecargoNocturnoDominical: number;
  horasExtrasDominicales: number;
  extNoctDom?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistroJornadaService {
  private apiUrl = `${environment.apiUrl}/RegistroJornada`;

  constructor(private http: HttpClient) {}

  obtenerResumenHoras(
    fechaInicio?: string,
    fechaFin?: string,
  ): Observable<ResumenEmpleado[]> {
    let params = new HttpParams()
      .set('usarFestivos', 'true')
      .set('incluirEdiciones', 'true');

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }

    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<ResumenEmpleado[]>(`${this.apiUrl}/resumenhoras`, { params });
  }

  exportarExcel(
    fechaInicio: string,
    fechaFin: string,
    ubicacion?: string,
    obra?: string
  ): void {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (ubicacion && ubicacion.toLowerCase() !== 'todos')
      params = params.set('ubicacion', ubicacion);

    if (obra && obra.toLowerCase() !== 'todos')
      params = params.set('obra', obra);

    this.http.get(`${this.apiUrl}/exportar-excel`, {
      params,
      responseType: 'blob'
    }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Jornada_${fechaInicio}_${fechaFin}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}