import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ContratosDashboard {
  totalEmpleadosActivos: number;
  contratosFirmados: number;
  contratosPendientes: number;
}
export interface ExamenIngresoDashboard {
  totalEmpleadosActivos: number;
  conExamen: number;
  sinExamen: number;
}

export interface AlturasDashboard {
  totalEmpleadosActivos: number;
  vigentes: number;
  vencidos: number;
  sinCurso: number;
}

export interface AfiliacionesDashboard {
  totalEmpleadosActivos: number;
  completos: number;
  incompletos: number;
  sinAfiliacion: number;
}

export interface DotacionDashboard {
  totalEmpleadosActivos: number;
  conDotacionVigente: number;
  dotacionVencida: number;
  sinDotacion: number;
}

export interface LiquidacionDashboard {
  totalEmpleados: number;
  pagadas: number;
  pendientes: number;
  sinRegistro: number;
}


@Injectable({
  providedIn: 'root'
})
export class RrhhDashboardService {

  private apiUrl = `${environment.apiUrl}/rrhh-dashboard`;

  constructor(private http: HttpClient) {}

  getContratos(): Observable<ContratosDashboard> {
    return this.http.get<ContratosDashboard>(`${this.apiUrl}/contratos`);
  }

  getExamenIngreso(): Observable<ExamenIngresoDashboard> {
  return this.http.get<ExamenIngresoDashboard>(
    `${this.apiUrl}/examen-ingreso`
  );
  }

  getAlturas(): Observable<AlturasDashboard> {
    return this.http.get<AlturasDashboard>(
      `${this.apiUrl}/alturas`
    );
  }

  getAfiliaciones(): Observable<AfiliacionesDashboard> {
    return this.http.get<AfiliacionesDashboard>(
      `${this.apiUrl}/afiliaciones`
    );
  }


  getLiquidacion(): Observable<LiquidacionDashboard> {
  return this.http.get<LiquidacionDashboard>(
    `${this.apiUrl}/liquidacion`
  );
  }

  getContratosPendientes(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/contratos/pendientes`);
}
getContratosFirmados(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/contratos/firmados`);
}

marcarComoFirmado(id: number) {
  return this.http.put(`${this.apiUrl}/contratos/${id}/firmar`, {});
}

marcarComoNoFirmado(id: number) {
  return this.http.put(`${this.apiUrl}/contratos/${id}/no-firmado`, {});
}

  getEmpleadosSinAfiliacion() {
  return this.http.get<any[]>(
    `${this.apiUrl}/afiliaciones/sin-afiliacion`
  );
  }

  getAfiliacionesPorEstado(estado: string) {
  if (!estado) {
    throw new Error('Estado no definido');
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/afiliaciones/${estado}`
  );
  }

 actualizarEmpleado(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/empleado/${id}/afiliacion`, data);
  }

getEmpleadosSinExamen() {
  return this.http.get<any[]>(
    `${this.apiUrl}/examen-ingreso/sin`
  );
}

getEmpleadosConExamen() {
  return this.http.get<any[]>(
    `${this.apiUrl}/examen-ingreso/con`
  );
}


actualizarFechaExamen(id: number, fecha: string) {
  return this.http.put(
    `${this.apiUrl}/actualizar-fecha-examen/${id}`,
    `"${fecha}"`,
    { headers: { 'Content-Type': 'application/json' } }
  );
}


  getDotacion(): Observable<DotacionDashboard> {
  return this.http.get<DotacionDashboard>(
    `${this.apiUrl}/dotacion`
  );
  }

getEmpleadosDotacionVigente() {
  return this.http.get<any[]>(
    `${this.apiUrl}/dotacion/vigente`
  );
}

getEmpleadosSinDotacion() {
  return this.http.get<any[]>(
    `${this.apiUrl}/dotacion/sin`
  );
}

getEmpleadosDotacionVencida() {
  return this.http.get<any[]>(
    `${this.apiUrl}/dotacion/vencida`
  );
}

getAlturasVigentes() {
  return this.http.get<any[]>(
    `${this.apiUrl}/alturas/vigentes`
  );
}

getAlturasVencidos() {
  return this.http.get<any[]>(
    `${this.apiUrl}/alturas/vencidos`
  );
}

actualizarAlturas(id: number, data: any) {
  return this.http.put(`${this.apiUrl}/alturas/${id}`, data);
}

getAlturasSinCurso() {
  return this.http.get<any[]>(
    `${this.apiUrl}/alturas/sin-curso`
  );
}

getEmpleadosInactivos() {
  return this.http.get<any[]>(`${this.apiUrl}/inactivos`);
}

actualizarLiquidacion(id: number, pagoLiquidacion: string, estado: string) {
  return this.http.put(
    `${this.apiUrl}/actualizar-liquidacion/${id}`,
    {
      pagoLiquidacion,
      estado
    }
  );
}


}
