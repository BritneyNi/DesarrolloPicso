import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Obra {
  id: number;
  nombreObra: string;
  responsableId: number | null;
  clienteObra: string;
  estado: string;
  costoObra: number;
  ciudad: string;
  ubicacion: string;
  responsableSecundario?: string;
  responsableNombre?: string;
  tamano?: number;
  fechaCreacion?: string;
  fechaInicio: string;
  fechaFin: string;
  turnoObra?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ObraService {
  private apiUrl = `${environment.apiUrl}/Obras`;
  private http = inject(HttpClient);

  getObras(): Observable<Obra[]> {
    return this.http.get<Obra[]>(this.apiUrl).pipe();
  }

  getObra(id: number): Observable<Obra> {
    return this.http.get<Obra>(`${this.apiUrl}/${id}`);
  }

  getObrasInactivas(): Observable<Obra[]> {
    return this.http.get<Obra[]>(`${this.apiUrl}/inactivas`);
  }

  createObra(obra: Omit<Obra, 'id'>): Observable<Obra> {
    return this.http.post<Obra>(this.apiUrl, obra);
  }

  editObra(id: number, obra: Obra): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, obra);
  }

  inactivarObra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  reactivarObra(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/reactivar`, {});
  }

  asignarEmpleados(obraId: number, empleadoIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${obraId}/asignar-empleados`, empleadoIds);
  }

  getEmpleadosPorObra(obraId: number): Observable<{ id: number; nombreCompleto: string; cargo: string; obra: string }[]> {
    return this.http.get<{ id: number; nombreCompleto: string; cargo: string; obra: string }[]>(`${this.apiUrl}/${obraId}/empleados`);
  }
}