import { Component, Input, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GanttService } from '../../services/gantt.service';

@Component({
  selector: 'app-informe-gantt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informe-gantt.component.html',
  styleUrls: ['./informe-gantt.component.css']
})

export class InformeGanttComponent implements OnInit, OnChanges {

  private ganttService = inject(GanttService);

  @Input() obraId: number | null = null;
  @Input() proyectoId: number | null = null;
  @Input() curvaSImage: string | null = null;

  cargando = false;

  evidencias: any[] = [];
  evidenciasSeleccionadas: number[] = [];

  mostrarSelectorEvidencias = false;

  ngOnInit() {
    this.cargarEvidencias();
  }

    ngOnChanges() {
    this.cargarEvidencias();
  }

  toggleSelectorEvidencias() {
  this.mostrarSelectorEvidencias = !this.mostrarSelectorEvidencias;
}

  cargarEvidencias() {
  if (!this.obraId) return;

  this.evidenciasSeleccionadas = []; // 🔥 limpiar selección anterior

  this.ganttService.obtenerEvidenciasInforme(this.obraId, this.proyectoId)
    .subscribe({
      next: (data) => {
        this.evidencias = data;
      },
      error: () => {
        this.evidencias = [];
      }
    });
}

    toggleEvidencia(id: number) {
    if (this.evidenciasSeleccionadas.includes(id)) {
      this.evidenciasSeleccionadas = this.evidenciasSeleccionadas.filter(x => x !== id);
      return;
    }

    if (this.evidenciasSeleccionadas.length >= 3) {
      alert('Solo puedes seleccionar máximo 3 evidencias');
      return;
    }

    this.evidenciasSeleccionadas.push(id);
  }

  generarInforme() {
    console.log('📤 Enviando curvaSImage:', !!this.curvaSImage);

  if (!this.obraId) {
    alert("Selecciona una obra primero");
    return;
  }

  this.cargando = true;

  const curvaSImage = this.curvaSImage;
  // 👆 luego lo conectamos bien

  this.ganttService.generarInforme(
    this.obraId,
    this.proyectoId,
    this.curvaSImage,
    this.evidenciasSeleccionadas
  )
  .subscribe({
    next: (res: Blob) => {

      const url = window.URL.createObjectURL(res);
      const a = document.createElement('a');

      a.href = url;
      a.download = 'informe-gantt.pdf';
      a.click();

      this.cargando = false;
    },
    error: () => {
      alert("Error generando informe");
      this.cargando = false;
    }
  });
}
}