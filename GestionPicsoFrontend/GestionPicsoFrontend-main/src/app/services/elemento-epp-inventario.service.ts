import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ElementoEppInventario {
  id: number;
  elementoEppId: number;
  talla: string;
  tipo: string;
  fechaRecepcion: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  estadoStock: 'OK' | 'Bajo' | 'Agotado';
  evidenciaUrl?:string;
}
export interface InventarioGeneralDetalle {
  talla: string;
  tipo: string;
  cantidadTotal: number;
  cantidadDisponible: number;
}

export interface InventarioGeneral {
  elementoEppId: number;
  elementoNombre: string;
  elementoTipo: string;
  totalCantidad: number;
  totalDisponible: number;
  detalle?: InventarioGeneralDetalle[];
}

export interface InventarioMovimiento {
  id: number;
  entregaEppId?: number;
  actaEntregaEppId?: number | null;
  tipoMovimiento: 'Entrada' | 'Salida' | 'Devolucion' | 'Ajuste';
  cantidad: number;
  fecha: Date;
  observacion?: string;

  talla?: string;
  tipo?: string;

  usuarioEntregaNombre?: string;
  empleadoRecibeNombre?: string;
}


@Injectable({ providedIn: 'root' })
export class ElementoEppInventarioService {

  private apiUrl = `${environment.apiUrl}/ElementoEppInventario`;

  constructor(private http: HttpClient) {}

  getInventarioGeneral() {
  return this.http.get<InventarioGeneral[]>(
    `${environment.apiUrl}/ElementoEppInventario/inventario-general`
    );
  }

  getByElemento(elementoId: number): Observable<ElementoEppInventario[]> {
    return this.http.get<ElementoEppInventario[]>(
      `${this.apiUrl}/elemento/${elementoId}`
    );
  }

  create(formData: FormData): Observable<ElementoEppInventario> {
  return this.http.post<ElementoEppInventario>(this.apiUrl, formData);
  }


  update(id: number, data: ElementoEppInventario): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

 descargarPdfGeneral(graficoBase64?: string | null) {
  return this.http.post(
    `${this.apiUrl}/pdf-general`,
    { graficoBase64 },
    { responseType: 'blob' }
  );
}


  descargarPdfElemento(elementoId: number) {
    return this.http.get(
      `${this.apiUrl}/pdf-elemento/${elementoId}`,
      { responseType: 'blob' }
    );
  }

getMovimientos(
  elementoEppId: number,
  talla?: string,
  tipo?: string
): Observable<InventarioMovimiento[]> {

  let params = `?elementoEppId=${elementoEppId}`;
  if (talla) params += `&talla=${talla}`;
  if (tipo) params += `&tipo=${tipo}`;

  return this.http.get<InventarioMovimiento[]>(
    `${this.apiUrl}/movimientos${params}`
  );
}


}
