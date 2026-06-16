import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface PermisoEnCaliente {
  id?: number;

  nombreEmpresa?: string;
  nit?: string;
  proyecto?: string;

  fechaInicio?: string;
  fechaCierre?: string;

  numeroPermiso?: string;
  herramientas?: string;
  tipoTrabajo?: string;
  descripcionTarea?: string;

  elementosProteccion?: string[];
  peligros?: string[];

  autorizantes?: {
    empleadoId: number;
    firmaBase64?: string;
    empleado?:{
        id:number,
        nombreCompleto: string;
    }
  }[];

   personal?: {
    id: number;
    firmado: boolean;
    tieneEvaluacion: boolean;
    empleado?: {
      id: number;
      nombreCompleto: string;
      cedula?: string;
      cargo?: string;
    };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class PermisoEnCalienteService {

  private apiUrl = `${environment.apiUrl}/permiso-en-caliente`;

  constructor(private http: HttpClient) {}

    crear(permiso: PermisoEnCaliente): Observable<number> {
        return this.http.post<number>(this.apiUrl, permiso);
    }

    obtener(id: number): Observable<PermisoEnCaliente> {
        return this.http.get<PermisoEnCaliente>(`${this.apiUrl}/${id}`);
    }

    obtenerTodos(): Observable<PermisoEnCaliente[]> {
    return this.http.get<PermisoEnCaliente[]>(this.apiUrl);
    }

    eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    actualizar(id: number, permiso: PermisoEnCaliente): Observable<void> {
  return this.http.put<void>(`${this.apiUrl}/${id}`, permiso);
}


    firmarAutorizante(id: number, firma: string) {
    return this.http.post(
        `${this.apiUrl}/autorizar/${id}`,
        firma,
        { headers: { 'Content-Type': 'application/json' } }
    );
}
}
