import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface TiempoAusentismo {
  id: number;
  nombreEmpleado: string;
  comentarios: string;
  tipo: string;           // NUEVO: incapacidad | enfermedad_general | calamidad_familiar | sin_justificacion
  fechaInicio: string;
  fechaFin: string;
  nombreArchivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AusentismoService {
  private apiUrl = `${environment.apiUrl}/DocumentoPermiso`;

  constructor(private http: HttpClient) {}

  subirDocumentoAusentismo(formData: FormData): Observable<TiempoAusentismo> {
    return this.http.post<TiempoAusentismo>(`${this.apiUrl}/SubirDocumento`, formData);
  }

  getDocumentos(): Observable<TiempoAusentismo[]> {
    return this.http.get<TiempoAusentismo[]>(this.apiUrl);
  }

  getDocumento(id: number): Observable<TiempoAusentismo> {
    return this.http.get<TiempoAusentismo>(`${this.apiUrl}/${id}`);
  }

  actualizarDocumento(id: number, data: TiempoAusentismo): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  eliminarDocumento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  verPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/ver/${id}`, { responseType: 'blob' });
  }

  descargarPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargar/${id}`, { responseType: 'blob' });
  }
}
