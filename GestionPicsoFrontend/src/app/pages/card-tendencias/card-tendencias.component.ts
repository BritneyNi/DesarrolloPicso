import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-card-tendencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './card-tendencias.component.html',
  styleUrls: ['./card-tendencias.component.css']
})
export class CardTendenciasComponent implements OnInit, AfterViewInit {
  @ViewChild('tendenciasChart') chartRef!: ElementRef;
  chart!: Chart;
  datos: any[] = [];
  mesesSeleccionados = 6;
  loading = true;
  viewReady = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.datos.length > 0) this.crearGrafica();
  }

  cargarDatos(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/rrhh-dashboard/tendencias?meses=${this.mesesSeleccionados}`)
      .subscribe({
        next: (res) => {
          this.datos = res;
          this.loading = false;
          if (this.viewReady) this.crearGrafica();
        },
        error: () => { this.loading = false; }
      });
  }

  cambiarMeses(): void {
    this.cargarDatos();
  }

  crearGrafica(): void {
    if (this.chart) this.chart.destroy();

    const labels = this.datos.map(d => d.mes);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Contratos',
            data: this.datos.map(d => d.contratos),
            backgroundColor: '#4ade80',
            borderRadius: 6
          },
          {
            label: 'Exámenes',
            data: this.datos.map(d => d.examenes),
            backgroundColor: '#60a5fa',
            borderRadius: 6
          },
          {
            label: 'Alturas',
            data: this.datos.map(d => d.alturas),
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Liquidaciones',
            data: this.datos.map(d => d.liquidaciones),
            backgroundColor: '#f87171',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const idx = items[0].dataIndex;
                const actual = this.datos[idx];
                const anterior = this.datos[idx - 1];
                if (!anterior) return '';
                const campo = items[0].dataset.label?.toLowerCase() === 'contratos' ? 'contratos'
                  : items[0].dataset.label?.toLowerCase() === 'exámenes' ? 'examenes'
                  : items[0].dataset.label?.toLowerCase() === 'alturas' ? 'alturas'
                  : 'liquidaciones';
                const diff = actual[campo] - anterior[campo];
                return diff > 0 ? `↑ +${diff} vs mes anterior` : diff < 0 ? `↓ ${diff} vs mes anterior` : '= igual que mes anterior';
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  getVariacion(campo: string, idx: number): { valor: number; clase: string } {
    if (idx === 0) return { valor: 0, clase: 'neutro' };
    const actual = this.datos[idx][campo];
    const anterior = this.datos[idx - 1][campo];
    const diff = actual - anterior;
    return {
      valor: diff,
      clase: diff > 0 ? 'sube' : diff < 0 ? 'baja' : 'neutro'
    };
  }
}