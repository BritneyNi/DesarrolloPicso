import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { Inventario } from './inventario.service';

export interface RevisionInventario {
  id?: number;
  inventarioId: number;
  inventario?: Inventario;
  fechaRevision?: string;
  responsable: string;
  encontrado: boolean;
  estadoFisico: string;
  observaciones: string;
}

@Injectable({
  providedIn: 'root',
})
export class RevisionInventarioService {
  private apiUrl = `${environment.apiUrl}/RevisionInventario`;

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<RevisionInventario[]> {
    return this.http.get<RevisionInventario[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<RevisionInventario> {
    return this.http.get<RevisionInventario>(`${this.apiUrl}/${id}`);
  }

  obtenerPorInventarioId(inventarioId: number): Observable<RevisionInventario[]> {
    return this.http.get<RevisionInventario[]>(`${this.apiUrl}/por-inventario/${inventarioId}`);
  }

  agregarRevision(rev: RevisionInventario): Observable<RevisionInventario> {
    return this.http.post<RevisionInventario>(this.apiUrl, rev);
  }

  actualizarRevision(id: number, rev: RevisionInventario): Observable<RevisionInventario> {
    return this.http.put<RevisionInventario>(`${this.apiUrl}/${id}`, rev);
  }

  eliminarRevision(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUsuarioActual(): { id: number; nombre: string; rol: string } | null {
    const userStr = localStorage.getItem('usuario');
    if (userStr) return JSON.parse(userStr);
    return null;
  }
}
