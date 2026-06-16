import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService } from '../../services/tiempos.service.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

interface RegistroHorario {
  empleado: Empleado;
  // campos de UI
  fechaIngreso: string;      // date input  (yyyy-MM-dd)
  horaIngreso: string;       // time input  (HH:mm)
  fechaSalida: string;
  horaSalida: string;
  // estado visual
  mensajeIngreso: string;
  mensajeSalida: string;
  errorIngreso: string;
  errorSalida: string;
  guardandoIngreso: boolean;
  guardandoSalida: boolean;
  expandido: boolean;
}

@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './horario.component.html',
  styleUrls: ['./horario.component.css']
})
export class HorarioComponent implements OnInit {

  // ── Servicios ────────────────────────────────────────────────────────────
  private authService   = inject(AuthService);
  private empleadoSvc   = inject(EmpleadoService);
  private tiemposSvc    = inject(TiemposService);
  private router        = inject(Router);

  // ── Estado ───────────────────────────────────────────────────────────────
  rol: string | null = null;
  nombreUsuario: string = '';

  empleados: Empleado[] = [];
  cargando = false;

  searchQuery = '';
  registros: RegistroHorario[] = [];
  registrosFiltrados: RegistroHorario[] = [];

  // Fecha global (por defecto hoy en Colombia)
  fechaGlobal: string = this.hoyLocal();
  horaIngresoGlobal: string = '';
  horaSalidaGlobal: string = '';

  // ── Init ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.rol = userData?.rol?.toUpperCase() ?? null;
    this.nombreUsuario = userData?.nombreCompleto ?? '';

    if (!this.rol || (this.rol !== 'ADMIN' && this.rol !== 'SST')) {
      this.router.navigate(['/home']);
      return;
    }

    this.cargarEmpleados();
  }

  // ── Empleados ─────────────────────────────────────────────────────────────
  cargarEmpleados(): void {
    this.cargando = true;

    this.empleadoSvc.obtenerEmpleados(1, 500).subscribe({
      next: (data) => {
        this.empleados = data.filter(e => e.estado === 'Activo')
          .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

        this.registros = this.empleados.map(emp => ({
          empleado: emp,
          fechaIngreso: this.fechaGlobal,
          horaIngreso: '',
          fechaSalida: this.fechaGlobal,
          horaSalida: '',
          mensajeIngreso: '',
          mensajeSalida: '',
          errorIngreso: '',
          errorSalida: '',
          guardandoIngreso: false,
          guardandoSalida: false,
          expandido: false
        }));

        this.aplicarFiltro();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  // ── Filtro de búsqueda ────────────────────────────────────────────────────
  filtrar(): void {
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.registrosFiltrados = this.registros.filter(r => {
      if (!q) return true;
      const texto = (
        r.empleado.nombreCompleto +
        r.empleado.cedula +
        r.empleado.cargo +
        r.empleado.obra
      ).toLowerCase();
      return texto.includes(q);
    });
  }

  limpiarBusqueda(): void {
    this.searchQuery = '';
    this.aplicarFiltro();
  }

  // ── Aplicar fecha global ──────────────────────────────────────────────────
  aplicarFechaGlobal(): void {
    this.registrosFiltrados.forEach(r => {
      r.fechaIngreso = this.fechaGlobal;
      r.fechaSalida  = this.fechaGlobal;
    });
  }

  aplicarHoraIngresoGlobal(): void {
    if (!this.horaIngresoGlobal) return;
    this.registrosFiltrados.forEach(r => {
      r.horaIngreso = this.horaIngresoGlobal;
    });
  }

  aplicarHoraSalidaGlobal(): void {
    if (!this.horaSalidaGlobal) return;
    this.registrosFiltrados.forEach(r => {
      r.horaSalida = this.horaSalidaGlobal;
    });
  }

  // ── Registro individual ───────────────────────────────────────────────────
  guardarIngreso(reg: RegistroHorario): void {
    if (!reg.fechaIngreso || !reg.horaIngreso) {
      reg.errorIngreso = 'Ingrese fecha y hora.';
      return;
    }

    const fechaHora = this.construirFechaUTC(reg.fechaIngreso, reg.horaIngreso);
    reg.guardandoIngreso = true;
    reg.mensajeIngreso   = '';
    reg.errorIngreso     = '';

    this.tiemposSvc.registrarIngreso({
      empleadoId: reg.empleado.id,
      fechaHoraEntrada: fechaHora,
      fechaHoraSalida: null,
      comentarios: '',
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        reg.mensajeIngreso   = '✅ Ingreso guardado';
        reg.guardandoIngreso = false;
        setTimeout(() => { reg.mensajeIngreso = ''; }, 3000);
      },
      error: (err) => {
        reg.errorIngreso     = err?.error?.mensaje ?? '❌ Error al guardar ingreso.';
        reg.guardandoIngreso = false;
      }
    });
  }

  guardarSalida(reg: RegistroHorario): void {
    if (!reg.fechaSalida || !reg.horaSalida) {
      reg.errorSalida = 'Ingrese fecha y hora.';
      return;
    }

    const fechaHora = this.construirFechaUTC(reg.fechaSalida, reg.horaSalida);
    reg.guardandoSalida = true;
    reg.mensajeSalida   = '';
    reg.errorSalida     = '';

    this.tiemposSvc.registrarSalida({
      empleadoId: reg.empleado.id,
      fechaHoraEntrada: null,
      fechaHoraSalida: fechaHora,
      comentarios: '',
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        reg.mensajeSalida   = '✅ Salida guardada';
        reg.guardandoSalida = false;
        setTimeout(() => { reg.mensajeSalida = ''; }, 3000);
      },
      error: (err) => {
        reg.errorSalida     = err?.error?.mensaje ?? '❌ Error al guardar salida.';
        reg.guardandoSalida = false;
      }
    });
  }

  // ── Guardado masivo ───────────────────────────────────────────────────────
  guardarTodosIngresosVisibles(): void {
    const conHora = this.registrosFiltrados.filter(r => r.horaIngreso && r.fechaIngreso);
    conHora.forEach(r => this.guardarIngreso(r));
  }

  guardarTodasSalidasVisibles(): void {
    const conHora = this.registrosFiltrados.filter(r => r.horaSalida && r.fechaSalida);
    conHora.forEach(r => this.guardarSalida(r));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private construirFechaUTC(fecha: string, hora: string): string {
    // fecha: "yyyy-MM-dd", hora: "HH:mm"
    // Colombia es UTC-5; construimos como UTC para enviar al backend
    return `${fecha}T${hora}:00.000Z`;
  }

  private hoyLocal(): string {
    const d = new Date();
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toggleExpandido(reg: RegistroHorario): void {
    reg.expandido = !reg.expandido;
  }

  get totalFiltrados(): number {
    return this.registrosFiltrados.length;
  }

  get totalConIngreso(): number {
    return this.registrosFiltrados.filter(r => r.horaIngreso).length;
  }

  get totalConSalida(): number {
    return this.registrosFiltrados.filter(r => r.horaSalida).length;
  }
}
