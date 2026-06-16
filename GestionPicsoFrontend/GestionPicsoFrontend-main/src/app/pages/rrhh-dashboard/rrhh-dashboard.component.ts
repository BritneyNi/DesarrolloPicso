import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { CardContratosComponent } from '../card-contratos/card-contratos.component';
import { CardExamenIngresoComponent } from '../card-examen-ingreso/card-examen-ingreso.component';
import { CardAlturasComponent } from '../card-alturas/card-alturas.component';
import { CardAfiliacionesComponent } from '../card-afiliaciones/card-afiliaciones.component';
import { CardDotacionComponent } from '../card-dotacion/card-dotacion.component';
import { CardLiquidacionComponent } from '../card-liquidacion/card-liquidacion.component';
import { CardTendenciasComponent } from '../card-tendencias/card-tendencias.component';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-rrhh-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent,
    CardContratosComponent, CardExamenIngresoComponent,
    CardAlturasComponent, CardAfiliacionesComponent,
    CardDotacionComponent, CardLiquidacionComponent,
    CardTendenciasComponent
  ],
  templateUrl: './rrhh-dashboard.component.html',
  styleUrls: ['./rrhh-dashboard.component.css']
})
export class RrhhDashboardComponent {
  @ViewChild('dashboardContenido') dashboardContenido!: ElementRef;
  exportando = false;

  async exportarPDF(): Promise<void> {
    this.exportando = true;
    try {
      const elemento = this.dashboardContenido.nativeElement;
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfImgWidth = pdfWidth - 20;
      const pdfImgHeight = pdfImgWidth / (imgWidth / imgHeight);

      // ── Encabezado Alloy Gray #6D6D73 ──
      pdf.setFillColor(109, 109, 115);
      pdf.rect(0, 0, pdfWidth, 22, 'F');
      pdf.setTextColor(183, 204, 18); // Green PICSO
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PICSO', 10, 10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('INGENIERÍA', 10, 16);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Dashboard RRHH', pdfWidth / 2, 10, { align: 'center' });
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(233, 224, 219);
      const fecha = new Date().toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      pdf.text(`Generado: ${fecha}`, pdfWidth / 2, 17, { align: 'center' });

      // ── Contenido ──
      let y = 27;
      if (pdfImgHeight <= pdfHeight - 27) {
        pdf.addImage(imgData, 'PNG', 10, y, pdfImgWidth, pdfImgHeight);
      } else {
        const pageHeightPx = (pdfHeight - 30) * (imgWidth / pdfImgWidth);
        let srcY = 0;
        let isFirst = true;
        while (srcY < imgHeight) {
          if (!isFirst) { pdf.addPage(); y = 10; }
          const sliceHeight = Math.min(pageHeightPx, imgHeight - srcY);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = sliceHeight;
          const ctx = sliceCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, srcY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
          const sliceData = sliceCanvas.toDataURL('image/png');
          const slicePdfHeight = (sliceHeight / imgWidth) * pdfImgWidth;
          pdf.addImage(sliceData, 'PNG', 10, y, pdfImgWidth, slicePdfHeight);
          srcY += sliceHeight;
          isFirst = false;
        }
      }

      // ── Footer ──
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        pdf.setPage(p);
        pdf.setFillColor(109, 109, 115);
        pdf.rect(0, pdfHeight - 12, pdfWidth, 12, 'F');
        pdf.setTextColor(183, 204, 18);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text('PICSO INGENIERÍA  ·  Dashboard RRHH', 10, pdfHeight - 5);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`Pág. ${p} de ${totalPages}`, pdfWidth - 10, pdfHeight - 5, { align: 'right' });
      }

      pdf.save(`Dashboard-RRHH-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Error al generar el PDF. Intenta de nuevo.');
    } finally {
      this.exportando = false;
    }
  }
}