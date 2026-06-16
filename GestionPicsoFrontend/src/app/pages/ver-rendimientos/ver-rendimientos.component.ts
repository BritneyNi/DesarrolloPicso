// ver-rendimientos.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RendimientoService, Rendimiento } from '../../services/rendimiento.service';
import { ContratistaService } from '../../services/contratista.service';
import { EmpleadoService } from '../../services/empleado-service.service';
import { ObraService, Obra } from '../../services/obras.service';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

interface ResumenGlobal {
  id: number;               // idEmpleado o idContratista
  esContratista: boolean;
  nombre: string;
  obraId: number;
  nombreObra: string;
  actividades: { actividad: string; unidad: string; totalCantidad: number; totalDias: number }[];
  mostrar: boolean;
}

@Component({
  selector: 'app-ver-rendimientos',
  standalone: true,
  imports: [NavbarComponent, BotonRegresarComponent, CommonModule, FormsModule],
  templateUrl: './ver-rendimientos.component.html',
  styleUrls: ['./ver-rendimientos.component.css'],
})
export class VerRendimientosComponent implements OnInit {
  resumenRendimientos: ResumenGlobal[] = [];
  todos: ResumenGlobal[] = [];
  obras: Obra[] = [];
  searchQuery = '';
  loading = true;

  private rendimientoService   = inject(RendimientoService);
  private contratistaService   = inject(ContratistaService);
  private empleadoService      = inject(EmpleadoService);
  private obraService          = inject(ObraService);

  ngOnInit(): void {
    this.loading = true;

    forkJoin({
      all: this.rendimientoService.obtenerTodos(1, 1000),
      contratistas: this.contratistaService.obtenerTodos(),
      empleados: this.empleadoService.obtenerEmpleados(1, 1000),
      obras: this.obraService.getObras()
    }).subscribe({
      next: ({ all, contratistas, empleados, obras }) => {
        this.obras = obras;

        const mapResumen = new Map<string, ResumenGlobal>();

        all.forEach(r => {
          const esC = r.idEmpleado === 0;
          const key = esC ? `C${r.idContratista}` : `E${r.idEmpleado}`;
          let entry = mapResumen.get(key);
          if (!entry) {
            const nombre = esC
              ? (contratistas.find(c => c.id === r.idContratista)?.nombre ?? 'Desconocido')
              : (empleados.find(e => e.id === r.idEmpleado)?.nombreCompleto ?? 'Desconocido');

            entry = {
              id: esC ? r.idContratista : r.idEmpleado,
              esContratista: esC,
              nombre,
              obraId: r.obraId,
              nombreObra: obras.find(o => o.id === r.obraId)?.nombreObra ?? 'Obra no asignada',
              actividades: [],
              mostrar: false
            };
            mapResumen.set(key, entry);
          }
          // acumular actividad
          const act = entry.actividades.find(a => a.actividad === r.actividad && a.unidad === r.unidad);
          if (!act) {
            entry.actividades.push({
              actividad: r.actividad,
              unidad: r.unidad,
              totalCantidad: r.cantidad,
              totalDias: r.dias
            });
          } else {
            act.totalCantidad += r.cantidad;
            act.totalDias     += r.dias;
          }
        });

        this.todos = Array.from(mapResumen.values());
        this.resumenRendimientos = [...this.todos];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  filtrarRendimientos(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.resumenRendimientos = !q
      ? [...this.todos]
      : this.todos.filter(r =>
          r.nombre.toLowerCase().includes(q) ||
          r.nombreObra.toLowerCase().includes(q)
        );
  }

  toggleActividades(id: number): void {
    const e = this.resumenRendimientos.find(r => r.id === id);
    if (e) e.mostrar = !e.mostrar;
  }
}
