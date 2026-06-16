import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class PermisoCalientePersonalService {

   private api = `${environment.apiUrl}/permiso-en-caliente-personal`;

  constructor(private http: HttpClient) {}

  obtenerPorPermiso(permisoId: number) {
    return this.http.get<any[]>(`${this.api}/${permisoId}`);
  }

  agregar(permisoId: number, empleadoId: number) {
    return this.http.post(this.api, {
      permisoEnCalienteId: permisoId,
      empleadoId
    });
  }

  eliminar(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
  
   firmar(id: number, firmaBase64: string) {
    return this.http.post(`${this.api}/${id}/firmar`, { firmaBase64 });
  }

   // 🔹 Obtener evaluación
  obtenerEvaluacion(personalId: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${personalId}/evaluacion`);
  }

  // 🔹 Guardar evaluación
  guardarEvaluacion(personalId: number, evaluacionJson: string): Observable<any> {
    return this.http.post(
      `${this.api}/${personalId}/evaluacion`,
      { evaluacionJson }
    );
  }
}
