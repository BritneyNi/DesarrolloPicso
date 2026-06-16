import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Contratista {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  obraId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContratistaService {
  private baseUrl = `${environment.apiUrl}/Contratistas`;

  constructor(private http: HttpClient) {}

  obtenerTodos(): Observable<Contratista[]> {
    return this.http.get<Contratista[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Contratista> {
    return this.http.get<Contratista>(`${this.baseUrl}/${id}`);
  }

  crear(contratista: Omit<Contratista, 'id'>): Observable<Contratista> {
    return this.http.post<Contratista>(this.baseUrl, contratista);
  }

  actualizar(id: number, contratista: Contratista): Observable<Contratista> {
    return this.http.put<Contratista>(`${this.baseUrl}/${id}`, contratista);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
