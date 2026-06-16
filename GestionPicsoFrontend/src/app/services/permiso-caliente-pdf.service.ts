// ================================================================
//  Angular — permiso-caliente-pdf.service.ts
//  src/app/services/permiso-caliente-pdf.service.ts
// ================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class PermisoCalientePdfService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  descargarEvaluacion(evaluacionId: number, nombreTrabajador: string): void {
    const url = `${this.api}/permiso-en-caliente-evaluaciones/${evaluacionId}/pdf`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `PermisoCaliente_${nombreTrabajador}_${evaluacionId}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Error descargando PDF:', err)
    });
  }
}

// ================================================================
//  USO en permiso-caliente-personal.component.ts:
//
//  1. Importar:
//     import { PermisoCalientePdfService } from '../../services/permiso-caliente-pdf.service';
//
//  2. Inyectar en constructor:
//     private pdfService: PermisoCalientePdfService
//
//  3. Reemplazar generarPdfEvaluacion():
//     async generarPdfEvaluacion() {
//       if (!this.evaluacion || !this.personalEvaluando) return;
//       const nombre = this.personalEvaluando.empleado?.nombreCompleto ?? 'trabajador';
//       const evalId = this.evaluacion[0]?.id ?? 0; // ajusta según tu modelo
//       this.pdfService.descargarEvaluacion(evalId, nombre);
//     }
// ================================================================
