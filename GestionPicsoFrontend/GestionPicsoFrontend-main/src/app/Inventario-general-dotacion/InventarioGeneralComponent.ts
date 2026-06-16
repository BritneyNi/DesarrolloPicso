import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { BotonRegresarComponent } from '../boton-regresar/boton-regresar.component';
import {ElementoEppInventarioService,InventarioGeneral} from '../services/elemento-epp-inventario.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Router } from '@angular/router';


@Component({
  selector: 'app-inventario-general',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './inventario-general.component.html',
  styleUrls: ['./inventario-general.component.css']
})
export class InventarioGeneralComponent implements OnInit {

    vistaLista = false;

    @ViewChild('graficoInventario') canvas!: ElementRef;

    chart: Chart | null = null;
    
    filtroEstado: 'TODOS' | 'OK' | 'Bajo' | 'Agotado' = 'TODOS';
    inventarioFiltrado: InventarioGeneral[] = [];

    totalElementos = 0;
    totalCantidad = 0;
    totalDisponible = 0;
    totalAgotados = 0;
    totalBajo = 0;
    totalOk = 0;

  inventario: InventarioGeneral[] = [];
  expanded: number | null = null;

  constructor(
    private inventarioService: ElementoEppInventarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.inventarioService.getInventarioGeneral().subscribe(data => {
    this.inventario = data;
    this.inventarioFiltrado = data;

    this.totalElementos = data.length;

    this.totalCantidad = data.reduce((s, i) => s + i.totalCantidad, 0);
    this.totalDisponible = data.reduce((s, i) => s + i.totalDisponible, 0);

    this.totalAgotados = data.filter(
      i => this.estado(i.totalCantidad, i.totalDisponible) === 'Agotado'
    ).length;

    this.totalBajo = data.filter(
      i => this.estado(i.totalCantidad, i.totalDisponible) === 'Bajo'
    ).length;

    this.totalOk = data.filter(
      i => this.estado(i.totalCantidad, i.totalDisponible) === 'OK'
    ).length;

      if (this.vistaLista) {
      this.crearGrafico();
    }
  });
}

ngAfterViewInit() {
  this.vistaLista = true;

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && this.chart) {
      this.chart.resize();
      this.chart.update();
    }
  });
}

irAInventarioElemento(elementoId: number) {
  this.router.navigate(['/inventario', elementoId]);
}


crearGrafico() {

  const total = this.totalOk + this.totalBajo + this.totalAgotados;

  const porcentaje = (valor: number) =>
  total === 0 ? 0 : Math.round((valor / total) * 100);

  const config: ChartConfiguration<'doughnut', number[], string> = {
    
    type: 'doughnut',
    data: {
      labels: [`OK (${porcentaje(this.totalOk)}%)`,`Bajo (${porcentaje(this.totalBajo)}%)`,`Agotado (${porcentaje(this.totalAgotados)}%)`],
      datasets: [{
        data: [this.totalOk, this.totalBajo, this.totalAgotados]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
            callbacks: {
            label: (context) => {
                const value = context.raw as number;
                const percent = porcentaje(value);
                return `${value} elementos (${percent}%)`;
            }
            }
        }
      },
      onClick: (_event, elements) => {
        if (!elements.length) return;

        const index = elements[0].index;
        const estado = ['OK', 'Bajo', 'Agotado'][index] as
          'OK' | 'Bajo' | 'Agotado';

        this.aplicarFiltro(estado);
      }
    }
  };
  const ctx = this.canvas.nativeElement.getContext('2d');
if (!ctx) return;

if (this.chart) this.chart.destroy();
this.chart = new Chart(ctx, config);

}


aplicarFiltro(estado: 'TODOS' | 'OK' | 'Bajo' | 'Agotado') {
  this.filtroEstado = estado;

  if (estado === 'TODOS') {
    this.inventarioFiltrado = this.inventario;
    return;
  }

  this.inventarioFiltrado = this.inventario.filter(e =>
    this.estado(e.totalCantidad, e.totalDisponible) === estado
  );
}



  toggle(id: number) {

  if (this.expanded === id) {
    this.expanded = null;
    return;
  }

  this.expanded = id;

  const elemento = this.inventario.find(e => e.elementoEppId === id);
  if (!elemento) return;

  // 👇 si ya lo cargó, no vuelva a pedir
  if (elemento.detalle) return;

  this.inventarioService.getByElemento(id).subscribe(detalle => {
    elemento.detalle = detalle.map(d => ({
      talla: d.talla,
      tipo: d.tipo,
      cantidadTotal: d.cantidadTotal,
      cantidadDisponible: d.cantidadDisponible
    }));
  });
}

  estado(total: number, disponible: number): string {
    if (disponible === 0) return 'Agotado';
    if (disponible <= total * 0.3) return 'Bajo';
    return 'OK';
  }

  descargarPdfGeneral() {

  const graficoBase64 = this.obtenerGraficoBase64();

  this.inventarioService.descargarPdfGeneral(graficoBase64)
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Inventario-General.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    });
}


descargarPdfElemento(elementoId?: number) {
  if (!elementoId) {
    console.error('ElementoEppId inválido:', elementoId);
    return;
  }

  this.inventarioService.descargarPdfElemento(elementoId)
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inventario-${elementoId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
}


obtenerGraficoBase64(): string | null {
  if (!this.chart) return null;
  return this.chart.toBase64Image('image/png', 1);
}


}
