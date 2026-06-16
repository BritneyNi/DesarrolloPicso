// ================================================================
//  Angular — permiso-alturas-pdf.service.ts
//  Servicio para descargar el PDF desde el backend
//
//  Ubicación sugerida:
//  src/app/services/permiso-alturas-pdf.service.ts
// ================================================================

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class PermisoAlturasPdfService {

  private api = environment.apiUrl; // ej: http://localhost:5000/api

  constructor(private http: HttpClient) {}

  /**
   * Descarga el PDF de evaluación generado en el backend
   * y lo abre / descarga en el navegador.
   */
  descargarEvaluacion(
    permisoId: number,
    personalId: number,
    evaluacionId: number,
    nombrePersona: string
  ): void {
    const url = `${this.api}/PermisoTrabajoAlturas/${permisoId}/personal/${personalId}/evaluacion/${evaluacionId}/pdf`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Evaluacion_${nombrePersona}_${evaluacionId}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      error: (err) => {
        console.error('Error descargando PDF:', err);
      }
    });
  }
}

// ================================================================
//  USO en permiso-alturas.component.ts
//  Reemplazar la llamada a exportarPdfEvaluacion() por:
//
//  constructor(
//    ...
//    private pdfService: PermisoAlturasPdfService
//  ) {}
//
//  exportarPdfEvaluacion(permiso: any, persona: any, evaluacion: any) {
//    this.pdfService.descargarEvaluacion(
//      permiso.id,
//      persona.id,
//      evaluacion.id,
//      persona.nombres
//    );
//  }
// ================================================================

