import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

export interface ElementoEpp {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  vidaUtilMeses?: number;
  requiereEvidencia: boolean;
  estado: string;
  evidenciaPath?: string;
 // get evidenciaUrl(): string | null;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ElementoEppService {

  private apiUrl = `${environment.apiUrl}/ElementoEpp`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ElementoEpp[]> {
    return this.http.get<ElementoEpp[]>(this.apiUrl);
  }

  getActivos(): Observable<ElementoEpp[]> {
    return this.http.get<ElementoEpp[]>(`${this.apiUrl}/activos`);
  }

  create(data: Partial<ElementoEpp>): Observable<ElementoEpp> {
    return this.http.post<ElementoEpp>(this.apiUrl, data);
  }
  delete(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  update(id: number, data: ElementoEpp): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  cambiarEstado(id: number): Observable<ElementoEpp> {
    return this.http.patch<ElementoEpp>(`${this.apiUrl}/${id}/estado`, {});
  }

  getById(id: number): Observable<ElementoEpp> {
  return this.http.get<ElementoEpp>(`${this.apiUrl}/by-id/${id}`);
  }

  createWithFile(formData: FormData): Observable<ElementoEpp> {
  return this.http.post<ElementoEpp>(this.apiUrl, formData);
  }

  updateWithFile(id: number, formData: FormData): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, formData);
  }

}

  