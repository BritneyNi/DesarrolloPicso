import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";
import { NavbarComponent } from '../../navbar/navbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rrhh-dotacion',
  standalone: true,
  imports: [CommonModule, BotonRegresarComponent,NavbarComponent,FormsModule],
  templateUrl: './rrhh-dotacion.component.html',
  styleUrls: ['./rrhh-dotacion.component.css']
})
export class RrhhDotacionComponent implements OnInit {

  empleados: any[] = [];
  loading = true;
  titulo = '';
  expandedEmpleadoId: number | null = null;
  modoSinDotacion = false;
  modoVencida = false;
  filtro: string = '';
  empleadosFiltrados: any[] = [];


  constructor(
    private route: ActivatedRoute,
    private dashboardService: RrhhDashboardService, private router: Router
  ) {}

ngOnInit(): void {
  this.route.queryParams.subscribe(params => {

    this.loading = true;
    this.modoSinDotacion = false;
    this.modoVencida = false;

    if (params['vigente']) {
      this.titulo = 'Empleados con dotación vigente';
      this.cargarVigentes();
    }

    if (params['sinDotacion']) {
      this.titulo = 'Empleados sin dotación';
      this.modoSinDotacion = true;
      this.cargarSinDotacion();
    }

    if (params['vencida']) {
      this.titulo = 'Empleados con dotación vencida';
      this.modoVencida = true;
      this.cargarVencidos();
    }

  });
}

irAEntregas() {
  this.router.navigate(['/entregas']);
}


cargarVencidos() {
  this.dashboardService.getEmpleadosDotacionVencida()
    .subscribe({
      next: res => {
        this.empleados = res;
        this.empleadosFiltrados = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
}



  cargarVigentes() {
    this.dashboardService.getEmpleadosDotacionVigente()
      .subscribe({
        next: res => {
          this.empleados = res;
          this.empleadosFiltrados = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  cargarSinDotacion() {
  this.dashboardService.getEmpleadosSinDotacion()
    .subscribe({
      next: res => {
        this.empleados = res;
        this.empleadosFiltrados = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
}


  calcularVencimiento(fechaEntrega: string): Date {
  const fecha = new Date(fechaEntrega);
  fecha.setMonth(fecha.getMonth() + 4);
  return fecha;
}

estaVencida(fechaEntrega: string): boolean {
  const vencimiento = this.calcularVencimiento(fechaEntrega);
  const hoy = new Date();
  return vencimiento < hoy;
}

toggleDetalle(id: number) {
  this.expandedEmpleadoId =
    this.expandedEmpleadoId === id ? null : id;
}

get mensajeVacio(): string {
  if (this.modoSinDotacion) return 'No hay empleados sin dotación.';
  if (this.modoVencida) return 'No hay empleados con dotación vencida.';
  return 'No hay empleados con dotación vigente.';
}

filtrar() {
  const valor = this.filtro.toLowerCase().trim();

  this.empleadosFiltrados = this.empleados.filter(e =>
    e.nombreCompleto.toLowerCase().includes(valor) ||
    e.cedula.toLowerCase().includes(valor) ||
    e.cargo.toLowerCase().includes(valor) ||
    e.obra.toLowerCase().includes(valor)
  );
}


}
