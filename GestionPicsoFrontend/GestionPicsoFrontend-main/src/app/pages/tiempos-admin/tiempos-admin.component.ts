import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { RegistroJornadaService, ResumenEmpleado } from '../../services/registrojornada.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { EmpleadoService } from '../../services/empleado-service.service';

interface EmpleadoAgrupado {
  nombreCompleto: string;
  totalHoras: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  horasDominicales: number;
  horasRecargoNocturnoDominical: number;
  horasExtrasDominicales: number;
  dominicales: boolean;
  festivos: boolean;
  ubicacion?: string;
}

@Component({
  selector: 'tiempos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent, NgFor],
  templateUrl: './tiempos-admin.component.html',
  styleUrls: ['./tiempos-admin.component.css']
})
export class TiemposAdminComponent implements OnInit {
  resumenEmpleados: any[] = [];
  
  private datosOriginales: ResumenEmpleado[] = [];

  fechaInicio: string = '';
  fechaFin: string = '';

  busquedaEmpleado: string = '';

  ubicaciones: string[] = []; 
  ubicacionSeleccionada: string = 'Todos';

  obras: string[] = [];
  obraSeleccionada: string = 'Todos';

  empleados: string[] = [];
  empleadoSeleccionado: string = 'Todos';

  empleadosFiltrados: ResumenEmpleado[] = [];

  private jornadaService = inject(RegistroJornadaService);
  private empleadoService = inject(EmpleadoService);

  ngOnInit(): void {
    this.cargarUbicaciones();
    this.cargarObras();
    this.cargarResumen();

    this.jornadaService.obtenerResumenHoras().subscribe({
      next: (data: ResumenEmpleado[]) => {
        this.datosOriginales = data;
        this.resumenEmpleados = [];
      },
      error: err => console.error('Error cargando empleados para buscador', err)
    });
  }

  private normalizarTexto(txt: string): string {
    if (!txt) return '';
    return txt
      .trim()
      .toLowerCase()
      .replace('bogotá', 'bogota')
      .replace('medellín', 'medellin')
      .replace('picso central', 'medellin')
      .replace('picso sentral', 'medellin');
  }

  cargarUbicaciones(): void {
    this.empleadoService.obtenerUbicaciones().subscribe({
      next: (ubicaciones: string[]) => {
        this.ubicaciones = ['Todos', ...ubicaciones];
      },
      error: (err) => console.error('Error al cargar ubicaciones:', err)
    });
  }

  cargarObras(): void {
    this.empleadoService.obtenerObras().subscribe({
      next: (obras: string[]) => {
        this.obras = ['Todos', ...obras];
      },
      error: (err) => console.error('Error al cargar obras:', err)
    });
  }

  cargarResumen(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      if (this.resumenEmpleados.length === 0 && this.busquedaEmpleado) {
        this.filtrarEmpleado();
      }
      return;
    }

    this.jornadaService.obtenerResumenHoras(this.fechaInicio, this.fechaFin).subscribe({
      next: (data: ResumenEmpleado[]) => {
        this.datosOriginales = data;
        let filtrados = data;

        if (this.ubicacionSeleccionada && this.ubicacionSeleccionada !== 'Todos') {
          const ubSel = this.normalizarTexto(this.ubicacionSeleccionada);
          filtrados = filtrados.filter(emp =>
            this.normalizarTexto(emp.ubicacion || '') === ubSel
          );
        }

        if (this.obraSeleccionada && this.obraSeleccionada !== 'Todos') {
          filtrados = filtrados.filter(emp =>
            (emp.obra || '').trim().toLowerCase() === this.obraSeleccionada.trim().toLowerCase()
          );
        }

        this.empleados = ['Todos', ...Array.from(new Set(filtrados.map(e => e.nombreCompleto)))];

        if (this.empleadoSeleccionado && this.empleadoSeleccionado !== 'Todos') {
          filtrados = filtrados.filter(emp =>
            emp.nombreCompleto === this.empleadoSeleccionado
          );
        }

        this.resumenEmpleados = filtrados.map((r: any) => ({
          fecha: r.fecha ? new Date(r.fecha).toISOString() : '',
          fechaSalida: r.horaSalida ? new Date(r.horaSalida).toISOString() : '',
          horaEntradaFormateada: r.horaEntrada
            ? new Date(r.horaEntrada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            : '',
          horaSalidaFormateada: r.horaSalida
            ? new Date(r.horaSalida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
            : '',
          horaEntrada: r.horaEntrada,
          horaSalida: r.horaSalida,
          nombreCompleto: r.nombreCompleto,
          totalHoras: r.horasTrabajadas.toFixed(2),
          horasDiurnas: r.horasDiurnas.toFixed(2),
          horasNocturnas: r.horasNocturnas.toFixed(2),
          horasExtrasDiurnas: r.horasExtrasDiurnas.toFixed(2),
          horasExtrasNocturnas: r.horasExtrasNocturnas.toFixed(2),
          horasDominicales: r.horasDominicales.toFixed(2),
          horasRecargoNocturnoDominical: r.horasRecargoNocturnoDominical.toFixed(2),
          horasExtrasDominicales: r.horasExtrasDominicales.toFixed(2),
          dominicales: r.trabajoDomingo ? 'Sí' : 'No',
          festivos: r.trabajoFestivo ? 'Sí' : 'No',
          ubicacion: this.normalizarTexto(r.ubicacion || ''),
          obra: r.obra || ''
        })) as any[];

        this.empleadosFiltrados = filtrados;
      },
      error: err => console.error('Error al cargar resumen de horas:', err)
    });
  }

  filtrarEmpleado(): void {
    const texto = this.busquedaEmpleado.trim().toLowerCase();
    if (!texto) {
      this.resumenEmpleados = [];
      return;
    }
    const filtrados = this.datosOriginales.filter(e =>
      e.nombreCompleto.toLowerCase().includes(texto)
    );
    this.resumenEmpleados = filtrados.map(e => this.mapearResumen(e));
  }

  private mapearResumen(e: ResumenEmpleado) {
    return {
      fecha: e.fecha || this.fechaInicio,
      horaEntrada: e.horaEntrada || '',
      horaSalida: e.horaSalida || '',
      nombreCompleto: e.nombreCompleto,
      totalHoras: e.horasTrabajadas?.toFixed(2) || '0',
      horasDiurnas: e.horasDiurnas?.toFixed(2) || '0',
      horasNocturnas: e.horasNocturnas?.toFixed(2) || '0',
      horasExtrasDiurnas: e.horasExtrasDiurnas?.toFixed(2) || '0',
      horasExtrasNocturnas: e.horasExtrasNocturnas?.toFixed(2) || '0',
      horasDominicales: e.horasDominicales?.toFixed(2) || '0',
      horasRecargoNocturnoDominical: e.horasRecargoNocturnoDominical?.toFixed(2) || '0',
      horasExtrasDominicales: e.horasExtrasDominicales?.toFixed(2) || '0',
      dominicales: e.trabajoDomingo ? 'Sí' : 'No',
      festivos: e.trabajoFestivo ? 'Sí' : 'No',
      ubicacion: this.normalizarTexto(e.ubicacion || ''),
      obra: e.obra || ''
    };
  }

  exportarExcel(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      console.warn('Selecciona un rango de fechas para exportar.');
      return;
    }

    const ubicacion = this.ubicacionSeleccionada !== 'Todos'
      ? this.ubicacionSeleccionada
      : undefined;

    const obra = this.obraSeleccionada !== 'Todos'
      ? this.obraSeleccionada
      : undefined;

    this.jornadaService.exportarExcel(
      this.fechaInicio,
      this.fechaFin,
      ubicacion,
      obra
    );
  }
}