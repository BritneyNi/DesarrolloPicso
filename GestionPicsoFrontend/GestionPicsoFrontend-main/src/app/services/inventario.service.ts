// src/app/services/inventario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Inventario {
  id: number;
  codigo: string;
  herramienta: string;
  numeroSerie: string;
  marca: string;
  modulo: string;
  nivel: string;
  observaciones: string;
  ubicacion: string;
  responsable: string;
  estado: string;
  cantidad: number;

  stockReservado?: number,
  stockDisponible?: number
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = `${environment.apiUrl}/Inventario`;

  constructor(private http: HttpClient) {}

  obtenerInventario(): Observable<Inventario[]> {
  return this.http.get<Inventario[]>(`${this.apiUrl}/stock-real`);
}

  agregarItem(item: Inventario): Observable<Inventario> {
    return this.http.post<Inventario>(this.apiUrl, item);
  }

  actualizarItem(item: Inventario): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/${item.id}`, item);
  }

  eliminarItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerPorObra(nombreObra: string): Observable<Inventario[]> {
    const url = `${this.apiUrl}/por-obra/${encodeURIComponent(nombreObra)}`;
    console.log('InventarioService.obtenerPorObra()', url);
    return this.http.get<Inventario[]>(url);
  }
}
