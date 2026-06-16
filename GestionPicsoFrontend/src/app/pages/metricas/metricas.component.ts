import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { MetricService } from '../../services/metric.service';
import { Obra } from '../../services/obras.service';
import { Chart } from 'chart.js/auto';
import { AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [NavbarComponent, BotonRegresarComponent,CommonModule],
  templateUrl: './metricas.component.html',
  styleUrl: './metricas.component.css'
})
export class MetricasComponent implements OnInit, AfterViewInit {

  private metricService = inject(MetricService);

  totalObras: number = 0;
  totalEmpleados: number = 0;
  salarioTotal: number = 0;
  costoPromedioMetro: number = 0;

  obras: Obra[] = [];
  obrasFiltradas: Obra[] = [];
  chart?: Chart;
  @ViewChild('grafCostoMetro') canvas!: ElementRef;

  chartPersonal?: Chart;
  @ViewChild('grafPersonalObra') canvasPersonal!: ElementRef;

  @ViewChild('grafPersonalCiudad') canvasPersonalCiudad!: ElementRef;
  chartPersonalCiudad?: Chart;

  @ViewChild('grafResumenObra') canvasResumen!: ElementRef;
  chartResumen?: Chart;

  @ViewChild('grafSalarioCiudad') canvasSalarioCiudad!: ElementRef;
  chartSalarioCiudad?: Chart;

  fechaDesde?: Date;
  fechaHasta?: Date;

  ngAfterViewInit(): void {

  this.metricService.getAllObras().subscribe(data => {
    this.obras = data;
    this.obrasFiltradas = data;
    this.crearGrafica();
  });

  this.aplicarFiltro();
}
 ngOnInit(): void {
  
}



aplicarFiltro() {

if (this.fechaDesde && this.fechaHasta && this.fechaDesde > this.fechaHasta) {
  alert('La fecha inicial no puede ser mayor a la final');
  return;
}
  // 🔥 si no hay fechas usa normales
  if (!this.fechaDesde || !this.fechaHasta) {

    this.metricService.getPersonalPorObra()
      .subscribe(data => this.cargarGraficaPersonal(data));

    this.metricService.getPersonalPorCiudad()
      .subscribe(data => this.cargarGraficaCiudad(data));

    this.metricService.getResumenObra()
      .subscribe(data => this.crearGraficaResumen(data));

    this.metricService.getSalarioCiudad()
      .subscribe(data => this.crearGraficaCiudad(data));

    return;
  }

  // 🔥 si hay fechas usa rango
  this.metricService.getPersonalPorObraRango(this.fechaDesde, this.fechaHasta)
    .subscribe(data => this.cargarGraficaPersonal(data));

  this.metricService.getPersonalPorCiudadRango(this.fechaDesde, this.fechaHasta)
    .subscribe(data => this.cargarGraficaCiudad(data));

  this.metricService.getResumenObraRango(this.fechaDesde, this.fechaHasta)
    .subscribe(data => this.crearGraficaResumen(data));

  this.metricService.getSalarioCiudadRango(this.fechaDesde, this.fechaHasta)
    .subscribe(data => this.crearGraficaCiudad(data));
}

  crearGrafica() {

  const dataset = this.metricService.getCostoPorMetroDataset(this.obrasFiltradas);

  this.totalObras = this.obrasFiltradas.length;

  this.costoPromedioMetro =
    dataset.length > 0
      ? dataset.reduce((acc, x) => acc + x.costoPorMetro, 0) / dataset.length
      : 0;

  // Recortar nombres largos
  const labels = dataset.map(x =>
    x.nombre.length > 15 ? x.nombre.substring(0, 15) + '…' : x.nombre
  );
  const costos = dataset.map(x => x.costo);
  const mt2 = dataset.map(x => x.tamano);
  const costoMetro = dataset.map(x => x.costoPorMetro);

  if (this.chart) this.chart.destroy();

  this.chart = new Chart(this.canvas.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Costo', data: costos },
        { label: 'Mt2', data: mt2 },
        { label: 'Costo por m2', data: costoMetro, type: 'line', yAxisID: 'y1' }
      ]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false, // ⭐ importante para que se ajuste al contenedor
  plugins: {
    legend: {
      position: 'bottom', // más cómodo en mobile
      labels: { boxWidth: 12, padding: 10,font: { size: 11 } }
    },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true },
    x: { beginAtZero: true,
      ticks:{
        maxRotation:90, //rota los labels si son largos
        minRotation:45,
        font:{ size :10} //reduce tamaño de letra
      }
     }
  }
}
  });
}

cargarGraficaPersonal(data:any[]) {

  const labels = data.map(x => x.obra);
  const valores = data.map(x => x.cantidad);
  this.totalEmpleados = data.reduce((acc, x) => acc + x.cantidad, 0);

  if (this.chartPersonal) this.chartPersonal.destroy();

  this.chartPersonal = new Chart(this.canvasPersonal.nativeElement, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Personal por obra',
          data: valores
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
    }
  });
}

cargarGraficaCiudad(data:any[]) {

  const labels = data.map(x => x.ciudad);
  const valores = data.map(x => x.cantidad);

  if (this.chartPersonalCiudad) this.chartPersonalCiudad.destroy();

  this.chartPersonalCiudad = new Chart(this.canvasPersonalCiudad.nativeElement,{
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: valores }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

crearGraficaResumen(data:any[]){

  const labels = data.map(x =>
  x.obra.length > 15 ? x.obra.substring(0, 15) + '…' : x.obra
);
this.salarioTotal = data.reduce((acc, x) => acc + x.salarioTotal, 0);

  const empleados = data.map(x=>x.empleados);
  const salarios = data.map(x=>x.salarioTotal);
  const promedio = data.map(x=>x.salarioPromedio);

  if(this.chartResumen) this.chartResumen.destroy();

  this.chartResumen = new Chart(this.canvasResumen.nativeElement,{
    type:'bar',
    data:{
      labels,
      datasets:[
        {label:'Empleados', data:empleados},
        {label:'Salario total', data:salarios},
        {label:'Salario promedio', data:promedio, type:'line', yAxisID:'y1'}
      ]
    },
   options: {
  responsive: true,
  maintainAspectRatio: false, // ⭐ importante para que se ajuste al contenedor
  plugins: {
    legend: {
      position: 'bottom', // más cómodo en mobile
      labels: { boxWidth: 12, padding: 10,font: { size: 11 } }
    },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true },
    x: { beginAtZero: true,
      ticks:{
        maxRotation:90,
        minRotation:45,
        font:{size:10}
      }
     }
  }
}
  });
}

crearGraficaCiudad(data:any[]){

  const labels = data.map(x=>x.ciudad);
  const salarios = data.map(x=>x.salarioTotal);

  if(this.chartSalarioCiudad) this.chartSalarioCiudad.destroy();

  this.chartSalarioCiudad = new Chart(this.canvasSalarioCiudad.nativeElement,{
    type:'doughnut',
    data:{
      labels,
      datasets:[{data:salarios}]
    },
    options: {
  responsive: true,
  maintainAspectRatio: false, // ⭐ importante para que se ajuste al contenedor
  plugins: {
    legend: {
      position: 'bottom', // más cómodo en mobile
      labels: { boxWidth: 12, padding: 10,font: { size: 11 } }
    },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true },
    x: { beginAtZero: true }
  }
}
  });
}


}