import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable,Subject,tap } from 'rxjs';
import { environment } from '../../environments/environments';

export enum EstadoSolicitud {
  Pendiente  = 'Pendiente',
  Aprobada   = 'Aprobada',
  Rechazada  = 'Rechazada',
  Comprado   = 'Comprado',
}

export interface SolicitudItem {
  id?: number;
  inventarioId: number;
  cantidad: number;
  estado?: EstadoSolicitud;
}

export interface Solicitud {
  id?: number;
  solicitante: string;
  obra: string;
  fechaSolicitud: string;
  observaciones?: string;
  estado?: EstadoSolicitud;
  items: SolicitudItem[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Solicitud`;

  private solicitudesActualizadas = new Subject<void>();
  solicitudesActualizadas$ = this.solicitudesActualizadas.asObservable();

  notificarCambio() {
  this.solicitudesActualizadas.next();
}

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(this.apiUrl);
  }

 crearSolicitud(sol: Solicitud): Observable<Solicitud> {
  const payload = {
    solicitante: sol.solicitante,
    obra: sol.obra,
    fechaSolicitud: sol.fechaSolicitud,
    observaciones: sol.observaciones,
    items: sol.items.map(item => ({
      inventarioId: item.inventarioId,
      cantidad: item.cantidad
    }))
  };

  return this.http.post<Solicitud>(this.apiUrl, payload).pipe(
    tap(() => this.notificarCambio())
  );
}

 cambiarEstado(id: number, nuevoEstado: EstadoSolicitud): Observable<void> {
  const params = new HttpParams().set('nuevoEstado', nuevoEstado);

  return this.http.patch<void>(
    `${this.apiUrl}/${id}/estado`,
    {},
    { params }
  ).pipe(
    tap(() => this.notificarCambio())
  );
}

  cambiarEstadoItem(itemId: number, nuevoEstado: EstadoSolicitud) {
  const params = new HttpParams().set('nuevoEstado', nuevoEstado);

  return this.http.patch(
    `${this.apiUrl}/item/${itemId}/estado`,
    {},
    { params }
  ).pipe(
    tap(() => this.notificarCambio())
  );
}

}
