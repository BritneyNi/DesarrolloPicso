import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PermisoAlturasService {

  private apiUrl = `${environment.apiUrl}/PermisoTrabajoAlturas`;

  constructor(private http: HttpClient) {}

  // ===============================
  // MÉTODOS EXISTENTES
  // ===============================

  crear(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  obtener(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  actualizar(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  obtenerTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  eliminarPermiso(id: number) {
  return this.http.delete(
    `${this.apiUrl}/${id}`
  );
}
buscar(q: string) {
  return this.http.get<any[]>(`${this.apiUrl}/buscar`, {
    params: { q }
  });
}

  // ===============================
  // PERSONAL AUTORIZADO
  // ===============================

  obtenerPersonal(permisoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${permisoId}/personal`);
  }

  agregarPersonal(permisoId: number, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${permisoId}/personal`, data);
  }

eliminarPersonal(id: number) {
  return this.http.delete(
    `${this.apiUrl}/personal/${id}`
  );
}

  // ===============================
  // COMPROBACIONES PREVIAS
  // ===============================

  // Crear comprobación previa (Evaluación)
 crearComprobacion(personalId: number, data: any) {
  return this.http.post(
    `${this.apiUrl}/personal/${personalId}/comprobaciones`,
    data
  );
}

  // Obtener todas las comprobaciones previas de un permiso
obtenerComprobaciones(personalId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/personal/${personalId}/comprobaciones`
  );
}

eliminarComprobacion(id: number) {
  return this.http.delete(
    `${this.apiUrl}/comprobaciones/${id}`
  );
}
}
