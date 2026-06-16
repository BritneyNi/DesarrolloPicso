import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RrhhDashboardService, AlturasDashboard } from '../../services/rrhh-dashboard.service';
import { Router } from '@angular/router';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-card-alturas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-alturas.component.html',
  styleUrls: ['./card-alturas.component.css']
})
export class CardAlturasComponent implements OnInit {
  data!: AlturasDashboard;
  loading = true;
  error = false;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getAlturas().subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
        setTimeout(() => this.renderChart(), 0);
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
    const pct = (this.data.vigentes / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  verVigentes() { this.router.navigate(['/rrhh/alturas'], { queryParams: { estado: 'vigentes' } }); }
  verVencidos() { this.router.navigate(['/rrhh/alturas'], { queryParams: { estado: 'vencidos' } }); }
  verSinCurso() { this.router.navigate(['/rrhh/alturas'], { queryParams: { estado: 'sin-curso' } }); }

  private renderChart() {
    const ctx = document.getElementById('alturasChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Vigentes', 'Vencidos', 'Sin curso'],
        datasets: [{
          data: [this.data.vigentes, this.data.vencidos, this.data.sinCurso],
          backgroundColor: ['#16a34a', '#dc2626', '#f59e0b'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        rotation: -90,
        circumference: 180,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}