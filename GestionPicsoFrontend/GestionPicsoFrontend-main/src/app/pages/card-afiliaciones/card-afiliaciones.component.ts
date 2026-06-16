import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RrhhDashboardService, AfiliacionesDashboard } from '../../services/rrhh-dashboard.service';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-card-afiliaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-afiliaciones.component.html',
  styleUrls: ['./card-afiliaciones.component.css']
})
export class CardAfiliacionesComponent implements OnInit, AfterViewInit {
  data!: AfiliacionesDashboard;
  loading = true;
  error = false;
  @ViewChild('afiliacionesChart') chartRef!: ElementRef;
  chart!: Chart;
  viewReady = false;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getAfiliaciones().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        if (this.viewReady) {
          this.crearGrafica(res.completos, res.incompletos, res.sinAfiliacion);
        }
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.data) {
      this.crearGrafica(this.data.completos, this.data.incompletos, this.data.sinAfiliacion);
    }
  }

  getSemaforo(): string {
    if (!this.data) return 'semaforo-gris';
    const total = this.data.totalEmpleadosActivos;
    if (total === 0) return 'semaforo-gris';
    const pct = (this.data.completos / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  irEstado(estado: string) {
    this.router.navigate(['/rrhh/afiliaciones'], { queryParams: { vista: estado } });
  }

  crearGrafica(completos: number, incompletos: number, sinAfiliacion: number) {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Completas', 'Incompletas', 'Sin Afiliación'],
        datasets: [{
          data: [completos, incompletos, sinAfiliacion],
          backgroundColor: ['#4ade80', '#facc15', '#f87171']
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } }
      }
    });
  }
}