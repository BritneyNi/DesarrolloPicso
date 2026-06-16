import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RrhhDashboardService, LiquidacionDashboard } from '../../services/rrhh-dashboard.service';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-card-liquidacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-liquidacion.component.html',
  styleUrls: ['./card-liquidacion.component.css']
})
export class CardLiquidacionComponent implements OnInit, AfterViewInit {
  data!: LiquidacionDashboard;
  loading = true;
  error = false;
  @ViewChild('liquidacionChart') chartRef!: ElementRef;
  chart!: Chart;
  viewReady = false;

  constructor(private dashboardService: RrhhDashboardService, private router: Router) {}

  ngOnInit(): void {
    this.dashboardService.getLiquidacion().subscribe({
      next: res => {
        this.data = res;
        this.loading = false;
        if (this.viewReady) this.crearGrafica();
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.data) this.crearGrafica();
  }

  getSemaforo(): string {
    if (!this.data) return 'semaforo-gris';
    const total = this.data.pagadas + this.data.pendientes + this.data.sinRegistro;
    if (total === 0) return 'semaforo-gris';
    const pct = (this.data.pagadas / total) * 100;
    if (pct >= 80) return 'semaforo-verde';
    if (pct >= 50) return 'semaforo-amarillo';
    return 'semaforo-rojo';
  }

  getPorcentajePagadas(): number {
    const total = this.data?.pagadas + this.data?.pendientes + this.data?.sinRegistro;
    if (!total) return 0;
    return (this.data.pagadas / total) * 100;
  }

  crearGrafica() {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Pagadas', 'Pendientes', 'Sin registro'],
        datasets: [{
          data: [this.data.pagadas, this.data.pendientes, this.data.sinRegistro],
          backgroundColor: ['#4ade80', '#f87171', '#94a3b8']
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  irPagadas() { this.router.navigate(['/rrhh/liquidacion'], { queryParams: { estado: 'pagadas' } }); }
  irPendientes() { this.router.navigate(['/rrhh/liquidacion'], { queryParams: { estado: 'pendientes' } }); }
  irSinRegistro() { this.router.navigate(['/rrhh/liquidacion'], { queryParams: { estado: 'sinregistro' } }); }
}