import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { tap } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';

export interface ConfirmarEntregaEppDto {
  empleadoId: number;
  responsableId?: number;
  responsableEnvio?: string;
  lugarEntrega: string;
  observaciones?: string;
  items: ConfirmarEntregaItemDto[];
}

export interface ConfirmarEntregaItemDto {
  elementoEppInventarioId: number;
  cantidad: number;
  fechaVencimiento?: string;
}

export interface EntregaEpp {
 id: number;
  empleadoId: number;
  empleadoNombre: string;
  elementoEppInventarioId: number;
  elementoNombre: string;
  talla: string;
  fechaEntrega: string;
  fechaVencimiento?: string;
  estado: string;
  observaciones?: string;
}

export interface EntregaItemDto {
  inventarioId: number;
  cantidad: number;
}

export interface EntregaMultipleDto {
  empleadoId: number;
  items: EntregaItemDto[];
  observaciones?: string;
}

export interface ResponsableEnvioDto {
  id: number;
  nombreCompleto: string;
}

export interface ResponsableEntregaDto {
  id: number;
  nombreCompleto: string;
}

export interface HistorialActa {
  actaId: number;
  empleadoId: number;
  empleadoNombre: string;
  responsableNombre: string;
  fechaEntrega: string;
  observaciones: string;
  quienRecibe: string;
  lugarEntrega: string;
  firmaEmpleadoUrl: string;
  firmaResponsableUrl: string;
  elementos: {
    id: number;
    nombre: string;
    talla: string;
    cantidad: number;
    estado: string;
    observaciones?: string;
    evidencias: string[];
    fechaEntrega: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class EntregaEppService {

  private api = `${environment.apiUrl}/EntregaEpp`;

  constructor(private http: HttpClient, private noti: NotificacionesService) {}

  getAll(): Observable<EntregaEpp[]> {
    return this.http.get<EntregaEpp[]>(this.api);
  }

  getByEmpleado(id: number): Observable<EntregaEpp[]> {
    return this.http.get<EntregaEpp[]>(`${this.api}/empleado/${id}`);
  }

  getHistorial(): Observable<HistorialActa[]> {
    return this.http.get<HistorialActa[]>(`${this.api}/historial`);
  }

  create(data: Partial<EntregaEpp>) {
    return this.http.post(this.api, data);
  }

  cambiarEstado(id: number, estado: string) {
    return this.http.patch(`${this.api}/${id}/estado?estado=${estado}`, {})
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  devolver(id: number) {
    return this.http.patch(`${this.api}/${id}/devolver`, {})
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  perdido(id: number) {
    return this.http.patch(`${this.api}/${id}/perdido`, {})
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  createMultiple(data: EntregaMultipleDto) {
    return this.http.post(`${this.api}/multiple`, data)
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  confirmarEntrega(dto: ConfirmarEntregaEppDto) {
    return this.http.post(`${this.api}/confirmar`, dto)
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  firmarActa(data: {
    actaId: number;
    tipo: string;
    firmaEmpleadoBase64?: string;
    firmaResponsableBase64?: string;
  }) {
    return this.http.post(`${this.api}/firmar-acta`, data);
  }

  subirEvidencia(data: {
    entregaEppId: number;
    archivoBase64: string;
    nombreArchivo: string;
  }) {
    return this.http.post(`${this.api}/subir-evidencia`, data);
  }

  descargarPdf(actaId: number) {
    window.open(`${environment.apiUrl}/EntregaEpp/acta/${actaId}/pdf`, '_blank');
  }

  descargarPdfEmpleado(empleadoId: number, desde?: string, hasta?: string) {
    let url = `${environment.apiUrl}/EntregaEpp/empleado/${empleadoId}/pdf`;
    const params: string[] = [];
    if (desde) params.push(`desde=${desde}`);
    if (hasta) params.push(`hasta=${hasta}`);
    if (params.length) url += '?' + params.join('&');
    window.open(url, '_blank');
  }

  getResponsablesEnvio(): Observable<ResponsableEnvioDto[]> {
    return this.http.get<ResponsableEnvioDto[]>(`${environment.apiUrl}/Empleados/responsables-envio`);
  }

  getResponsablesEntrega(): Observable<ResponsableEntregaDto[]> {
    return this.http.get<ResponsableEntregaDto[]>(`${environment.apiUrl}/Empleados/responsables-entrega`);
  }
}
