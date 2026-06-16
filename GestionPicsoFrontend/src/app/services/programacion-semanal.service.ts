import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ProgramacionSemanal {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  obraId: number;
  obraNombre: string;
  residenteNombre: string;
  fechaInicioSemana: string;
  fechaFinSemana: string;
  fechaCreacion?: string;
}

export interface CrearProgramacionDto {
  empleadoId: number;
  obraId: number;
  residenteId: number;
}

export interface DisponibilidadEmpleado {
  disponible: boolean;
  programacion?: {
    id: number;
    obraId: number;
    obraNombre: string;
    residenteNombre: string;
    fechaInicioSemana: string;
    fechaFinSemana: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ProgramacionSemanalService {
  private api = `${environment.apiUrl}/ProgramacionSemanal`;

  constructor(private http: HttpClient) {}

  getSemanaActual(obraId: number): Observable<ProgramacionSemanal[]> {
    return this.http.get<ProgramacionSemanal[]>(`${this.api}/semana-actual?obraId=${obraId}`);
  }

  getDisponibilidad(empleadoId: number): Observable<DisponibilidadEmpleado> {
    return this.http.get<DisponibilidadEmpleado>(`${this.api}/empleado/${empleadoId}/disponibilidad`);
  }

  empleadoProgramado(empleadoId: number): Observable<{ programado: boolean }> {
    return this.http.get<{ programado: boolean }>(`${this.api}/empleado/${empleadoId}/semana-actual`);
  }

  // FIX: ahora acepta fechas opcionales para filtrar por rango
  getTodas(fechaInicio?: string, fechaFin?: string): Observable<ProgramacionSemanal[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<ProgramacionSemanal[]>(`${this.api}/todas`, { params });
  }

  getHistorico(obraId: number): Observable<ProgramacionSemanal[]> {
    return this.http.get<ProgramacionSemanal[]>(`${this.api}/historico?obraId=${obraId}`);
  }

  crear(dtos: CrearProgramacionDto[]): Observable<{ guardados: number; errores: string[] }> {
    return this.http.post<{ guardados: number; errores: string[] }>(this.api, dtos);
  }

  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
