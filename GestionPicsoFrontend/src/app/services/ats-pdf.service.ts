// ================================================================
//  Angular — ats-pdf.service.ts
//  src/app/services/ats-pdf.service.ts
// ================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class AtsPdfService {

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // PDF individual: un ATS + una actividad específica
  descargarIndividual(atsId: number, actividadId: number, nombreEmpleado: string): void {
    const url = `${this.api}/Ats/${atsId}/actividad/${actividadId}/pdf`;
    this._descargar(url, `ATS_${nombreEmpleado}.pdf`);
  }

  // PDF masivo: un ATS con todas sus actividades
  descargarMasivo(atsId: number, descripcion: string): void {
    const url = `${this.api}/Ats/${atsId}/pdf`;
    this._descargar(url, `ATS_${descripcion}.pdf`);
  }

  private _descargar(url: string, filename: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Error descargando PDF:', err)
    });
  }
}

// ================================================================
//  USO en ats.component.ts:
//
//  1. Importar:
//     import { AtsPdfService } from '../../services/ats-pdf.service';
//
//  2. Inyectar en constructor:
//     private pdfService: AtsPdfService
//
//  3. Reemplazar exportarPdfMasivo():
//     exportarPdfMasivo(ats: Ats) {
//       this.pdfService.descargarMasivo(ats.id, ats.descripcion ?? 'ATS');
//     }
//
//  4. Reemplazar exportarPdfIndividual():
//     exportarPdfIndividual(ats: Ats, empleado: Actividad) {
//       const nombre = empleado.empleado?.nombreCompleto ?? 'empleado';
//       this.pdfService.descargarIndividual(ats.id, empleado.id, nombre);
//     }
// ================================================================
