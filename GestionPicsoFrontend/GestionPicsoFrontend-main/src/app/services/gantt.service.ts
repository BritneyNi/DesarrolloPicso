import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { ProyectoGanttDto } from '../models/actividad-gantt.model';

export interface ProyectoGantt {
  id: number;
  obraId: number;
  nombre: string;
}

export interface AvanceSemanal {
  numeroSemana: number;
  cantidadEjecutada: number;
  fechaInicioSemana: string;
  fechaFinSemana: string;
}



@Injectable({ providedIn: 'root' })
export class GanttService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gantt`; // 🔥 minúscula y correcto

  // 🔹 Obtener todo
/* getActividades(proyectoId?: number): Observable<ActividadGanttDto[]> {

  const url = proyectoId
    ? `${this.apiUrl}/obtener-gantt?proyectoId=${proyectoId}`
    : `${this.apiUrl}/obtener-gantt`;

  return this.http.get<ActividadGanttDto[]>(url);
}*/
getGantt(obraId?: number) {

  let params: any = {};

  if (obraId !== null && obraId !== undefined) {
    params.obraId = obraId;
  }
  return this.http.get<any[]>(
  `${environment.apiUrl}/gantt/obtener-gantt`,
  { params }
);
}

  // 🔹 Crear actividad
  crearActividad(data: any) {
    return this.http.post(`${this.apiUrl}/crear-actividad`, data);
  }

  // 🔹 Registrar avance
  registrarAvance(data: any) {
    return this.http.post(`${this.apiUrl}/registrar-avance`, data);
  }

  getObras(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/obras`);
  }

  crearProyecto(data:any){
    return this.http.post(`${this.apiUrl}/crear-proyecto`, data);
  }

  getProyectos(obraId: number): Observable<ProyectoGantt[]> {
    return this.http.get<ProyectoGantt[]>(
      `${this.apiUrl}/proyectos?obraId=${obraId}`
    );
  }

  actualizarActividad(data: any) {
    return this.http.put(`${this.apiUrl}/actualizar-actividad/${data.id}`, data);
  }

  eliminarActividad(id: number) {
    return this.http.delete(`${this.apiUrl}/actividades/${id}`);
  }

  eliminarProyecto(id: number) {
    return this.http.delete(`${this.apiUrl}/proyectos/${id}`);
  }

  actualizarProyecto(proyecto: any) {
    return this.http.put(
    `${this.apiUrl}/actualizar-proyecto/${proyecto.id}`,
    proyecto
  );
  }

  subirEvidencia(formData: FormData) {
  return this.http.post(`${this.apiUrl}/subir-evidencia`, formData);
  }

  obtenerEvidencias(actividadId: number) {
  return this.http.get<any[]>(
    `${this.apiUrl}/evidencias/${actividadId}`
  );
  }

  generarInforme(
  obraId: number,
  proyectoId: number | null,
  curvaSImage: string | null,
  evidenciaIds: number[]
  ) {
  const body = {
    obraId,
    proyectoId,
    curvaSImage,
    evidenciaIds
  };

  return this.http.post(`${this.apiUrl}/informe`, body, {
    responseType: 'blob'
  });
}

  obtenerEvidenciasInforme(obraId: number, proyectoId?: number | null) {
  let params: any = { obraId };

  if (proyectoId) {
    params.proyectoId = proyectoId;
  }

  return this.http.get<any[]>(`${this.apiUrl}/evidencias-informe`, { params });
}
}