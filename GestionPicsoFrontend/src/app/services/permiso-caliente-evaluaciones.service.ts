import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PermisoCalienteEvaluacionesService {

  private api = `${environment.apiUrl}/permiso-en-caliente-evaluaciones`;

  constructor(private http: HttpClient) {}

  // Crear evaluación
  crear(data: { personalId: number; evaluacionJson: string }): Observable<any> {
    return this.http.post(this.api, data);
  }

  // Listar evaluaciones por personal
  obtenerPorPersonal(personalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/personal/${personalId}`);
  }

  // Obtener una evaluación
  obtener(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }
  //eliminar evaluacion
  eliminar(id: number) {
  return this.http.delete(`${this.api}/${id}`);
}

}
