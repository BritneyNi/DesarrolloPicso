import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Movimiento {
  id?: number;
  inventarioId: number;
  codigoHerramienta: string;
  nombreHerramienta: string;
  responsable: string;
  obra: string;
  fechaMovimiento: string;
  tipoMovimiento: string;
  estado: string;
  comentario?: string;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})

export class MovimientoService {
  private apiUrl = `${environment.apiUrl}/Movimiento`;

  constructor(private http: HttpClient) {}

  getMovimientos(): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(this.apiUrl);
  }

  crearMovimiento(mov: Movimiento): Observable<Movimiento> {
    return this.http.post<Movimiento>(this.apiUrl, mov);
  }
}

