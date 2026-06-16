import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RrhhDashboardService, ExamenIngresoDashboard } from '../../services/rrhh-dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-examen-ingreso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-examen-ingreso.component.html',
  styleUrls: ['./card-examen-ingreso.component.css']
})
export class CardExamenIngresoComponent implements OnInit {
  data!: ExamenIngresoDashboard;
  loading = true;
  error = false;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getExamenIngreso().subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  getSemaforo(): string {
    if (!this.data) return 'semaforo-gris';
    const total = this.data.totalEmpleadosActivos;
    if (total === 0) return 'semaforo-gris';
    const pct = (this.data.conExamen / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  irConExamen() {
    this.router.navigate(['/rrhh/examen-ingreso'], { queryParams: { vista: 'con' } });
  }

  irSinExamen() {
    this.router.navigate(['/rrhh/examen-ingreso'], { queryParams: { vista: 'sin' } });
  }
}