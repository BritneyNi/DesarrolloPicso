import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environments';

export interface PruebaHermeticidad {
  id?: number;
  proyecto?: string;
  cliente: string;
  tipoPrueba: string;
  descripcion: string;

  inicioPrueba: string;
  finPrueba?: string;

  presionInicial:number;
  presionFinal:number;

  cumple?: string;

  firmaContratista?: string;
  firmaConstructor?: string;

  imagenInicioUrl?: string;
  imagenFinalUrl?: string;

  nota?: string;

  estado?: string; // "Iniciada" | "Finalizada"
}

@Injectable({
  providedIn: 'root'
})
export class PruebasHermeticidadService {

  private api = `${environment.apiUrl}/PruebaHermetricidad`;

  constructor(private http: HttpClient) {}

  // 🟢 Crear prueba (inicio)
  crearPrueba(formData: FormData): Observable<PruebaHermeticidad> {
    return this.http.post<PruebaHermeticidad>(this.api, formData).pipe(
      catchError(err => {
        console.error('❌ Error creando prueba:', err);
        return throwError(() => err);
      })
    );
  }

  // 🔵 Finalizar prueba
  finalizarPrueba(id: number, formData: FormData): Observable<PruebaHermeticidad> {
    return this.http.put<PruebaHermeticidad>(`${this.api}/${id}/finalizar`, formData).pipe(
      catchError(err => {
        console.error('❌ Error finalizando prueba:', err);
        return throwError(() => err);
      })
    );
  }

  // 📥 Obtener todas
  obtenerPruebas(): Observable<PruebaHermeticidad[]> {
    return this.http.get<PruebaHermeticidad[]>(this.api).pipe(
      catchError(err => {
        console.error('❌ Error obteniendo pruebas:', err);
        return throwError(() => err);
      })
    );
  }

  // 📥 Obtener por id (por si luego haces detalle o PDF)
  obtenerPorId(id: number): Observable<PruebaHermeticidad> {
    return this.http.get<PruebaHermeticidad>(`${this.api}/${id}`).pipe(
      catchError(err => {
        console.error('❌ Error obteniendo prueba:', err);
        return throwError(() => err);
      })
    );
  }

  eliminarPrueba(id: number) {
  return this.http.delete(`${this.api}/${id}`);
  }

  actualizarPrueba(id: number, data: PruebaHermeticidad): Observable<any> {
    return this.http.put(`${this.api}/${id}`, data);
  }

  descargarPdf(id: number) {
  return this.http.get(`${this.api}/${id}/pdf`, {
    responseType: 'blob'
  });
  }

  obtenerPorObra(obraId: number) {
  return this.http.get<any[]>(`${this.api}/por-obra/${obraId}`);
  }
}