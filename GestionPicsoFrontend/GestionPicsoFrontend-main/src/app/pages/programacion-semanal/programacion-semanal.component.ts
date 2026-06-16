import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ProgramacionSemanalService, ProgramacionSemanal, CrearProgramacionDto } from '../../services/programacion-semanal.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

interface EmpleadoConEstado extends Empleado {
  programado: boolean;
  bloqueado: boolean;
  obraBloqueo?: string;
  residenteBloqueo?: string;
  seleccionado: boolean;
}

@Component({
  selector: 'app-programacion-semanal',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './programacion-semanal.component.html',
  styleUrls: ['./programacion-semanal.component.css']
})
export class ProgramacionSemanalComponent implements OnInit {
  @Input() obraId!: number;
  @Input() obraNombre: string = '';
  @Input() residenteId!: number;

  rol = '';
  empleados: EmpleadoConEstado[] = [];
  programaciones: ProgramacionSemanal[] = [];
  todasLasProgramaciones: ProgramacionSemanal[] = [];
  historico: ProgramacionSemanal[] = [];
  cargando = false;
  cargandoAdmin = false;
  guardando = false;
  vistaActiva: 'semana' | 'historico' | 'admin' = 'semana';

  semanaActual = '';

  constructor(
    private programacionService: ProgramacionSemanalService,
    private empleadoService: EmpleadoService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.obraId = parseInt(params['obraId']) || this.obraId;
      this.obraNombre = decodeURIComponent(params['obraNombre'] || this.obraNombre);
    });

    const usuarioJson = localStorage.getItem('usuario');
    if (usuarioJson) {
      const { rol } = JSON.parse(usuarioJson);
      this.rol = rol;
    }
    const residenteIdStr = localStorage.getItem('usuario-id');
    if (residenteIdStr) this.residenteId = parseInt(residenteIdStr);

    this.semanaActual = this.calcularSemanaActual();
    this.cargarDatos();

    // Si es admin, cargar vista general automáticamente
    if (this.rol?.toLowerCase() === 'admin') {
      this.cargarTodasLasProgramaciones();
    }
  }

  get esAdmin(): boolean {
    return this.rol?.toLowerCase() === 'admin';
  }

  // Agrupar programaciones por obraId para la vista admin
  get obraIds(): number[] {
    return [...new Set(this.todasLasProgramaciones.map(p => p.obraId))];
  }

  getPorObra(obraId: number): ProgramacionSemanal[] {
    return this.todasLasProgramaciones.filter(p => p.obraId === obraId);
  }

  getNombreObra(obraId: number): string {
    return this.todasLasProgramaciones.find(p => p.obraId === obraId)?.obraNombre || `Obra ${obraId}`;
  }

  private calcularSemanaActual(): string {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diasDesdeElLunes = (dia === 0 ? 6 : dia - 1);
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeElLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `${fmt(lunes)} - ${fmt(domingo)}`;
  }

  private cargarDatos(): void {
    this.cargando = true;
    forkJoin({
      empleados: this.empleadoService.obtenerEmpleados(1, 500),
      programaciones: this.programacionService.getSemanaActual(this.obraId).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ empleados, programaciones }) => {
        this.programaciones = programaciones;
        const activos = empleados.filter(e =>
          e.estado === 'Activo' &&
          e.obra?.toLowerCase() === this.obraNombre?.toLowerCase()
        );
        this.cargarEstadoEmpleados(activos);
      },
      error: () => { this.cargando = false; }
    });
  }

  private cargarEstadoEmpleados(empleados: Empleado[]): void {
    const obs = empleados.map(emp =>
      this.programacionService.getDisponibilidad(emp.id).pipe(catchError(() => of({ disponible: true, programacion: undefined })))
    );

    forkJoin(obs).subscribe({
      next: (disponibilidades) => {
        this.empleados = empleados.map((emp, i) => {
          const disp = disponibilidades[i];
          const yaPrograma = this.programaciones.some(p => p.empleadoId === emp.id);
          return {
            ...emp,
            programado: yaPrograma,
            bloqueado: !disp.disponible && !yaPrograma,
            obraBloqueo: disp.programacion?.obraNombre,
            residenteBloqueo: disp.programacion?.residenteNombre,
            seleccionado: yaPrograma
          } as EmpleadoConEstado;
        });
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  get todosSeleccionados(): boolean {
    return this.empleados.filter(e => !e.bloqueado && !e.programado).every(e => e.seleccionado);
  }

  toggleTodos(valor: boolean): void {
    this.empleados.forEach(e => {
      if (!e.bloqueado && !e.programado) e.seleccionado = valor;
    });
  }

  get empleadosPendientes(): EmpleadoConEstado[] {
    return this.empleados.filter(e => !e.programado && !e.bloqueado);
  }

  get empleadosProgramados(): EmpleadoConEstado[] {
    return this.empleados.filter(e => e.programado);
  }

  get empleadosBloqueados(): EmpleadoConEstado[] {
    return this.empleados.filter(e => e.bloqueado);
  }

  guardarProgramacion(): void {
    const seleccionados = this.empleados.filter(e => e.seleccionado && !e.programado && !e.bloqueado);
    if (!seleccionados.length) {
      this.snackBar.open('⚠️ Selecciona al menos un empleado.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.guardando = true;
    const dtos: CrearProgramacionDto[] = seleccionados.map(e => ({
      empleadoId: e.id,
      obraId: this.obraId,
      residenteId: this.residenteId
    }));

    this.programacionService.crear(dtos).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.guardados > 0)
          this.snackBar.open(`✅ ${res.guardados} empleado(s) programados correctamente.`, 'Cerrar', { duration: 4000 });
        if (res.errores.length > 0)
          res.errores.forEach(e => this.snackBar.open(`⚠️ ${e}`, 'Cerrar', { duration: 5000 }));
        this.cargarDatos();
        // Recargar vista admin también si está activa
        if (this.vistaActiva === 'admin') this.cargarTodasLasProgramaciones();
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('❌ Error al guardar programación.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  eliminarProgramacion(empleadoId: number): void {
    const prog = this.programaciones.find(p => p.empleadoId === empleadoId);
    if (!prog) return;
    if (!confirm('¿Seguro que deseas eliminar esta programación?')) return;

    this.programacionService.eliminar(prog.id).subscribe({
      next: () => {
        this.snackBar.open('✅ Programación eliminada.', 'Cerrar', { duration: 3000 });
        this.cargarDatos();
      },
      error: () => this.snackBar.open('❌ Error al eliminar.', 'Cerrar', { duration: 3000 })
    });
  }

  eliminarProgramacionAdmin(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar esta programación?')) return;
    this.programacionService.eliminar(id).subscribe({
      next: () => {
        this.snackBar.open('✅ Programación eliminada.', 'Cerrar', { duration: 3000 });
        this.cargarTodasLasProgramaciones();
      },
      error: () => this.snackBar.open('❌ Error al eliminar.', 'Cerrar', { duration: 3000 })
    });
  }

  cargarHistorico(): void {
    this.vistaActiva = 'historico';
    this.programacionService.getHistorico(this.obraId).subscribe({
      next: (data) => this.historico = data,
      error: () => {}
    });
  }

  cargarTodasLasProgramaciones(): void {
    this.vistaActiva = 'admin';
    this.cargandoAdmin = true;
    this.programacionService.getTodas().subscribe({
      next: (data) => {
        this.todasLasProgramaciones = data;
        this.cargandoAdmin = false;
      },
      error: () => { this.cargandoAdmin = false; }
    });
  }
}
