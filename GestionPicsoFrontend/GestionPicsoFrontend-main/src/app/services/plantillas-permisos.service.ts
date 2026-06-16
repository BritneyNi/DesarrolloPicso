import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class PlantillasPermisosService {

  private apiUrl = `${environment.apiUrl}/plantillas-permisos`;

  constructor(private http: HttpClient) { }

  // Retorna el Excel como blob
 obtenerPlantilla(tipo: 'alturas' | 'caliente'): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/${tipo}`, { responseType: 'blob' });

}



}
