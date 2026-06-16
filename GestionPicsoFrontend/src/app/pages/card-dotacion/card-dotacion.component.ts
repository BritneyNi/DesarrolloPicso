import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RrhhDashboardService, DotacionDashboard } from '../../services/rrhh-dashboard.service';
import { ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-card-dotacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-dotacion.component.html',
  styleUrls: ['./card-dotacion.component.css']
})
export class CardDotacionComponent implements OnInit {
  data!: DotacionDashboard;
  loading = true;
  error = false;
  @ViewChild('dotacionChart') dotacionChartRef!: ElementRef;
  private chart!: Chart;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getDotacion().subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
        setTimeout(() => this.crearGrafica(), 0);
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
    const pct = (this.data.conDotacionVigente / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  crearGrafica() {
    const ctx = this.dotacionChartRef.nativeElement;
    this.chart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Vigente', 'Vencida', 'Sin dotación'],
        datasets: [{
          data: [this.data.conDotacionVigente, this.data.dotacionVencida, this.data.sinDotacion],
          backgroundColor: ['#2e7d32', '#f57c00', '#dc2626']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: { r: { ticks: { display: false } } }
      }
    });
  }

  irDotacionVencida() { this.router.navigate(['/rrhh/dotacion'], { queryParams: { vencida: true } }); }
  irSinDotacion() { this.router.navigate(['/rrhh/dotacion'], { queryParams: { sinDotacion: true } }); }
  irDotacionVigente() { this.router.navigate(['/rrhh/dotacion'], { queryParams: { vigente: true } }); }
}