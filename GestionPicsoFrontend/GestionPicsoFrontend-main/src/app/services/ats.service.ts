import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { Empleado } from './empleado-service.service';
import SignaturePad from 'signature_pad';

export interface Ats {
  id?: number;
  descripcion?: string;
  peligros?: string;
  riesgo?: string; 
  queSucede?: string;
  queHacer?: string;
  firmaSst?: string;
  atsList?: Actividad[];
  actividades?: Actividad[];
  mostrarFormularioActividad?: boolean;
  signaturePadEmpleado?: SignaturePad;
  responsableAts?:string;
  responsable?:string;
  fechaRegistro?:string;
  
}

export interface Actividad {
  id?: number;
  empleadoId: number;
  empleado?: Empleado;

  empresaContratista: string;
  trabajoARealizar: string;
  equiposAUtilizar: string;
  equiposEmergencia?: string;

  fecha?: string;
  fechaFin?: string;

  tipoPermiso?: string[];

  firmaEmpleado?: string;

  atsId?: number;
  ats?: Ats;

  observacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AtsService {

  private apiUrl = `${environment.apiUrl}/Actividad`;
  private atsUrl = `${environment.apiUrl}/Ats`;

  constructor(private http: HttpClient) {}

  // =========================================
  // ACTIVIDADES
  // =========================================

  getAll(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.apiUrl);
  }

  getById(id: number): Observable<Actividad> {
    return this.http.get<Actividad>(`${this.apiUrl}/${id}`);
  }

  // Crear ACTIVIDAD dentro de un ATS
  createInsideAts(atsId: number, actividad: Actividad): Observable<Actividad> {
    return this.http.post<Actividad>(`${this.apiUrl}/ats/${atsId}`, actividad);
  }

  update(id: number, actividad: Actividad): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, actividad);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // =========================================
  // ATS PRINCIPALES
  // =========================================

  // Crear ATS Principal
  addAtsPrincipal(data: Ats) {
    return this.http.post<any>(`${this.atsUrl}/principal`, data);
  }

  // Obtener lista de ATS Principales
  getAtsPrincipales(): Observable<Ats[]> {
    return this.http.get<Ats[]>(`${this.atsUrl}/principal`);
  }

  // Obtener un ATS por ID
  getAtsById(id: number): Observable<Ats> {
    return this.http.get<Ats>(`${this.atsUrl}/${id}`);
  }

  // Actualizar ATS
  updateAts(id: number, ats: Ats): Observable<Ats> {
    return this.http.put<Ats>(`${this.atsUrl}/${id}`, ats);
  }

  // Eliminar ATS
  deleteAts(id: number): Observable<void> {
    return this.http.delete<void>(`${this.atsUrl}/${id}`);
  }

  // =========================================
  // FIRMAS
  // =========================================

  updateFirmaSst(id: number, firmaBase64: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/firmaSst`, { firmaBase64 });
  }

  updateFirmaEmpleado(id: number, firmaBase64: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/firmaEmpleado`, { firmaBase64 });
  }
}
