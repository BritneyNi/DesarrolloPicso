import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GanttService } from '../../services/gantt.service';

@Component({
  selector: 'app-evidencias-gantt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evidencias-gantt.component.html',
  styleUrls: ['./evidencias-gantt.component.css']
})
export class EvidenciasGanttComponent implements OnInit {

  private ganttService = inject(GanttService);

  @Input() actividadId!: number;
  @Input() semana?: number;

  archivo: File | null = null;
  evidencias: any[] = [];

  ngOnInit() {
    if (this.actividadId) {
      this.cargarEvidencias();
    }
  }

  onFileChange(event: any) {
    this.archivo = event.target.files[0];
  }

  subir() {
    if (!this.archivo || !this.actividadId) return;

    const formData = new FormData();
    formData.append('file', this.archivo);
    formData.append('actividadId', this.actividadId.toString());

    if (this.semana !== undefined && this.semana !== null) {
      formData.append('numeroSemana', this.semana.toString());
    }

    this.ganttService.subirEvidencia(formData)
      .subscribe(() => {
        alert("📸 Evidencia subida");
        this.archivo = null;
        this.cargarEvidencias();
      });
  }

  cargarEvidencias() {
    this.ganttService.obtenerEvidencias(this.actividadId)
      .subscribe(data => {
        this.evidencias = data;
      });
  }
}