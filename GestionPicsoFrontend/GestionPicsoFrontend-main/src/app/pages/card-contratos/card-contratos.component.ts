import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RrhhDashboardService, ContratosDashboard } from '../../services/rrhh-dashboard.service';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-card-contratos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-contratos.component.html',
  styleUrls: ['./card-contratos.component.css']
})
export class CardContratosComponent implements OnInit, AfterViewInit {
  data!: ContratosDashboard;
  loading = true;
  error = false;
  @ViewChild('contratosChart') chartRef!: ElementRef;
  chart!: Chart;
  viewReady = false;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getContratos().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        if (this.viewReady) {
          this.crearGrafica(res.contratosPendientes, res.contratosFirmados);
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
      this.crearGrafica(this.data.contratosPendientes, this.data.contratosFirmados);
    }
  }

  getSemaforo(): string {
    if (!this.data) return 'semaforo-gris';
    const total = this.data.totalEmpleadosActivos;
    if (total === 0) return 'semaforo-gris';
    const pct = (this.data.contratosFirmados / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  irPendientes() { this.router.navigate(['/rrhh/contratos/pendientes']); }

  irFirmados() {
    this.router.navigate(['/rrhh/contratos/pendientes'], { queryParams: { vista: 'firmados' } });
  }

  crearGrafica(pendientes: number, firmados: number) {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'Firmados'],
        datasets: [{ data: [pendientes, firmados], backgroundColor: ['#f87171', '#4ade80'] }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}