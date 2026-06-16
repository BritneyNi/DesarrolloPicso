import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TiemposService } from '../services/tiempos.service.service';
import { AusentismoService } from '../services/documento-permiso.service';
import { NominaLockService } from '../services/nomina-lock.service';
import { ProgramacionSemanalService } from '../services/programacion-semanal.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface TiempoExtendido {
  ingresoId: number | null;
  salidaId: number | null;
  empleadoId: number;
  nombreEmpleado: string;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  comentarios: string;
  permisosEspeciales: string;
  archivo?: File | null;
  sinProgramacion?: boolean;
  // ── Nuevos campos para UX fecha+hora separados ─────────────────────────
  fechaIngreso: string;
  horaIngreso: string;
  fechaSalida: string;
  horaSalida: string;
  mensajeIngreso: string;
  mensajeSalida: string;
  errorIngreso: string;
  errorSalida: string;
  guardandoIngreso: boolean;
  guardandoSalida: boolean;
  expandido: boolean;
}

@Component({
  selector: 'app-lista-tiempos',
  standalone: true,
  imports: [NgFor, FormsModule, MatExpansionModule, CommonModule],
  templateUrl: './lista-tiempos.component.html',
  styleUrls: ['./lista-tiempos.component.css'],
  providers: [TiemposService, AusentismoService]
})
export class ListaTiemposComponent implements OnInit, OnChanges {
  @Input() empleadosSeleccionados: { id: number; nombreEmpleado: string; obra: string }[] = [];
  @Output() tiemposActualizados = new EventEmitter<void>();

  // ── Rol inyectado desde el componente padre ──────────────────────────────
  // El padre (detalle-obra) debe pasar el rol del usuario logueado.
  // Valores posibles: 'ADMIN' | 'SST' | 'responsable' | 'RESPONSABLE'
  @Input() rolUsuario: string = '';

  listaTiempos: TiempoExtendido[] = [];
  empleadoSeleccionado: TiempoExtendido | null = null;
  empleadoSeleccionadoHistorial: TiempoExtendido[] = [];

  // ── Panel global (modo fecha+hora separados) ─────────────────────────────
  fechaGlobal: string = this.hoyLocal();
  horaIngresoGlobal: string = '';
  horaSalidaGlobal: string = '';

  // Mantener datetime-local global para ausentismo (no cambia)
  fechaInicioPermiso = '';
  fechaFinPermiso   = '';
  modo              = 'tiempos';

  // ── Fechas límite para responsable ──────────────────────────────────────
  fechaMinSemana: string = '';
  fechaMaxSemana: string = '';

  constructor(
    private tiemposService: TiemposService,
    private ausentismoService: AusentismoService,
    private snackBar: MatSnackBar,
    public nominaLock: NominaLockService,
    private programacionService: ProgramacionSemanalService
  ) {}

  ngOnInit() {
    this.calcularRangoSemana();
    this.generarListaTiempos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadosSeleccionados']) {
      this.generarListaTiempos();
    }
  }

  // ── Helpers de rol ────────────────────────────────────────────────────────
  get esEspecial(): boolean {
    const r = (this.rolUsuario ?? '').toUpperCase();
    return r === 'ADMIN' || r === 'SST';
  }

  // ── Rango semana actual (lunes–domingo) ───────────────────────────────────
  private calcularRangoSemana(): void {
    const hoy = new Date();
    const dia = hoy.getDay();                        // 0=dom, 1=lun…
    const diasDesdeElLunes = dia === 0 ? 6 : dia - 1;
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diasDesdeElLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    this.fechaMinSemana = this.formatDate(lunes);
    this.fechaMaxSemana = this.formatDate(domingo);

    // Inicializar fecha global dentro de la semana
    this.fechaGlobal = this.hoyLocal();
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private hoyLocal(): string {
    const d = new Date();
    return this.formatDate(d);
  }

  // ── Generación de lista ──────────────────────────────────────────────────
  private generarListaTiempos() {
    this.listaTiempos = this.empleadosSeleccionados.map(emp => ({
      ingresoId: null,
      salidaId: null,
      empleadoId: emp.id,
      nombreEmpleado: emp.nombreEmpleado,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      comentarios: '',
      permisosEspeciales: '',
      archivo: null,
      sinProgramacion: false,
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

    this.listaTiempos.forEach(emp => {
      // Cargar últimos registros (para vista de estado actual)
      forkJoin([
        this.tiemposService.obtenerUltimoIngresoPorEmpleado(emp.empleadoId).pipe(catchError(() => of(null))),
        this.tiemposService.obtenerUltimaSalidaPorEmpleado(emp.empleadoId).pipe(catchError(() => of(null)))
      ]).subscribe({
        next: ([ingreso, salida]) => {
          emp.fechaHoraEntrada = ingreso?.fechaHoraEntrada ?? null;
          emp.fechaHoraSalida  = salida?.fechaHoraSalida  ?? null;
        }
      });

      // Verificar programación semanal
      this.programacionService.empleadoProgramado(emp.empleadoId).pipe(
        catchError(() => of({ programado: true }))
      ).subscribe({
        next: (res) => { emp.sinProgramacion = !res.programado; }
      });
    });
  }

  get hayEmpleadosSinProgramacion(): boolean {
    return this.listaTiempos.some(t => t.sinProgramacion);
  }

  get nombresSinProgramacion(): string {
    return this.listaTiempos
      .filter(t => t.sinProgramacion)
      .map(t => t.nombreEmpleado)
      .join(', ');
  }

  // ── Validación de fecha para responsable ─────────────────────────────────
  private fechaEsDeEstaSemana(fecha: string): boolean {
    if (this.esEspecial) return true;           // ADMIN/SST sin restricción
    return fecha >= this.fechaMinSemana && fecha <= this.fechaMaxSemana;
  }

  // ── Panel global ─────────────────────────────────────────────────────────
  aplicarFechaGlobal(): void {
    if (!this.esEspecial && !this.fechaEsDeEstaSemana(this.fechaGlobal)) {
      this.snackBar.open('⚠️ Solo puedes registrar fechas de la semana actual.', 'Cerrar', { duration: 4000 });
      this.fechaGlobal = this.hoyLocal();
      return;
    }
    this.listaTiempos.forEach(r => {
      r.fechaIngreso = this.fechaGlobal;
      r.fechaSalida  = this.fechaGlobal;
    });
  }

  aplicarHoraIngresoGlobal(): void {
    if (!this.horaIngresoGlobal) return;
    this.listaTiempos.forEach(r => {
      if (!r.sinProgramacion || this.esEspecial) {
        r.horaIngreso = this.horaIngresoGlobal;
      }
    });
  }

  aplicarHoraSalidaGlobal(): void {
    if (!this.horaSalidaGlobal) return;
    this.listaTiempos.forEach(r => {
      if (!r.sinProgramacion || this.esEspecial) {
        r.horaSalida = this.horaSalidaGlobal;
      }
    });
  }

  // ── Guardar ingreso individual ────────────────────────────────────────────
  guardarIngreso(reg: TiempoExtendido): void {
    if (!this.esEspecial && reg.sinProgramacion) {
      reg.errorIngreso = '🔒 Sin programación esta semana.';
      return;
    }
    if (!reg.fechaIngreso || !reg.horaIngreso) {
      reg.errorIngreso = 'Ingrese fecha y hora.';
      return;
    }
    if (!this.esEspecial && !this.fechaEsDeEstaSemana(reg.fechaIngreso)) {
      reg.errorIngreso = '⚠️ Solo puedes registrar la semana actual.';
      return;
    }

    const fechaHora = this.construirFechaUTC(reg.fechaIngreso, reg.horaIngreso);

    if (this.nominaLock.estaBloquada(fechaHora)) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      return;
    }

    reg.guardandoIngreso = true;
    reg.mensajeIngreso   = '';
    reg.errorIngreso     = '';

    this.tiemposService.registrarIngreso({
      empleadoId: reg.empleadoId,
      fechaHoraEntrada: fechaHora,
      comentarios: reg.comentarios,
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        reg.mensajeIngreso   = '✅ Ingreso guardado';
        reg.guardandoIngreso = false;
        reg.fechaHoraEntrada = fechaHora;
        setTimeout(() => { reg.mensajeIngreso = ''; }, 3000);
        this.tiemposActualizados.emit();
      },
      error: (err) => {
        reg.guardandoIngreso = false;
        if (err.status === 422) {
          const codigo = err.error?.codigo;
          if (codigo === 'SIN_PROGRAMACION') {
            reg.errorIngreso = '🔒 Empleado sin programación esta semana.';
            reg.sinProgramacion = true;
          } else {
            reg.errorIngreso = err.error?.mensaje ?? this.nominaLock.MENSAJE_BLOQUEO;
          }
        } else {
          reg.errorIngreso = '❌ Error al guardar ingreso.';
        }
      }
    });
  }

  // ── Guardar salida individual ─────────────────────────────────────────────
  guardarSalida(reg: TiempoExtendido): void {
    if (!this.esEspecial && reg.sinProgramacion) {
      reg.errorSalida = '🔒 Sin programación esta semana.';
      return;
    }
    if (!reg.fechaSalida || !reg.horaSalida) {
      reg.errorSalida = 'Ingrese fecha y hora.';
      return;
    }
    if (!this.esEspecial && !this.fechaEsDeEstaSemana(reg.fechaSalida)) {
      reg.errorSalida = '⚠️ Solo puedes registrar la semana actual.';
      return;
    }

    const fechaHora = this.construirFechaUTC(reg.fechaSalida, reg.horaSalida);

    if (this.nominaLock.estaBloquada(fechaHora)) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      return;
    }

    reg.guardandoSalida = true;
    reg.mensajeSalida   = '';
    reg.errorSalida     = '';

    this.tiemposService.registrarSalida({
      empleadoId: reg.empleadoId,
      fechaHoraSalida: fechaHora,
      comentarios: reg.comentarios,
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        reg.mensajeSalida   = '✅ Salida guardada';
        reg.guardandoSalida = false;
        reg.fechaHoraSalida = fechaHora;
        setTimeout(() => { reg.mensajeSalida = ''; }, 3000);
        this.tiemposActualizados.emit();
      },
      error: (err) => {
        reg.guardandoSalida = false;
        if (err.status === 422) {
          const codigo = err.error?.codigo;
          if (codigo === 'SIN_PROGRAMACION') {
            reg.errorSalida = '🔒 Empleado sin programación esta semana.';
            reg.sinProgramacion = true;
          } else {
            reg.errorSalida = err.error?.mensaje ?? this.nominaLock.MENSAJE_BLOQUEO;
          }
        } else {
          reg.errorSalida = '❌ Error al guardar salida.';
        }
      }
    });
  }

  // ── Guardar masivo ────────────────────────────────────────────────────────
  guardarTodosIngresosVisibles(): void {
    const elegibles = this.listaTiempos.filter(r =>
      r.horaIngreso && r.fechaIngreso && (this.esEspecial || !r.sinProgramacion)
    );
    if (!elegibles.length) {
      this.snackBar.open('⚠️ No hay ingresos listos para guardar.', 'Cerrar', { duration: 3000 });
      return;
    }
    elegibles.forEach(r => this.guardarIngreso(r));
  }

  guardarTodasSalidasVisibles(): void {
    const elegibles = this.listaTiempos.filter(r =>
      r.horaSalida && r.fechaSalida && (this.esEspecial || !r.sinProgramacion)
    );
    if (!elegibles.length) {
      this.snackBar.open('⚠️ No hay salidas listas para guardar.', 'Cerrar', { duration: 3000 });
      return;
    }
    elegibles.forEach(r => this.guardarSalida(r));
  }

  // ── Ausentismo (sin cambios) ──────────────────────────────────────────────
  esValidoParaGuardarAusentismo(): boolean {
    return !!this.fechaInicioPermiso &&
           !!this.fechaFinPermiso &&
           this.fechaInicioPermiso <= this.fechaFinPermiso &&
           this.listaTiempos.some(t => t.permisosEspeciales.trim() !== '');
  }

  guardarAusentismo() {
    const regs = this.listaTiempos.filter(t => t.permisosEspeciales.trim());
    const observables = regs.map(t => {
      const fd = new FormData();
      fd.append('NombreEmpleado', t.nombreEmpleado);
      fd.append('Comentarios', t.comentarios);
      fd.append('Tipo', t.permisosEspeciales);  // FIX: enviar como Tipo, no PermisosEspeciales
      fd.append('FechaInicio', this.fechaInicioPermiso);
      fd.append('FechaFin', this.fechaFinPermiso);
      if (t.archivo) {
        fd.append('Archivo', t.archivo);
      } else {
        fd.append('Archivo', new Blob([]), '');
      }
      return this.ausentismoService.subirDocumentoAusentismo(fd);
    });

    forkJoin(observables).subscribe({
      next: () => {
        this.snackBar.open('✅ Ausentismo enviado correctamente.', 'Cerrar', { duration: 3000 });
        setTimeout(() => location.reload(), 1000);
      },
      error: () => {
        this.snackBar.open('❌ Error al guardar ausentismo.', 'Cerrar', { duration: 3000 });
      }
    });
  }

  manejarArchivo(event: Event, i: number) {
    const input = (event.target as HTMLInputElement);
    if (input.files?.length) {
      this.listaTiempos[i].archivo = input.files[0];
    }
  }

  // ── Editar (sin cambios funcionales) ─────────────────────────────────────
  cambiarModo(modo: string) {
    this.modo = modo;
    if (modo === 'editar' && this.listaTiempos.length) {
      this.cargarTodosLosRegistrosDelEmpleado(this.listaTiempos[0].empleadoId);
    }
  }

  seleccionarEmpleado(emp: TiempoExtendido) {
    this.empleadoSeleccionado = emp;
    this.cargarTodosLosRegistrosDelEmpleado(emp.empleadoId);
  }

  validarFechaEntrada(registro: TiempoExtendido) {
    if (!registro.fechaHoraEntrada) return;
    if (this.nominaLock.estaBloquada(registro.fechaHoraEntrada)) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      registro.fechaHoraEntrada = null;
    }
  }

  validarFechaSalida(registro: TiempoExtendido) {
    if (!registro.fechaHoraSalida) return;
    if (this.nominaLock.estaBloquada(registro.fechaHoraSalida)) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      registro.fechaHoraSalida = null;
    }
  }

  fechaEstaBloquada(fecha: string | null): boolean {
    if (!fecha) return false;
    return this.nominaLock.estaBloquada(fecha);
  }

  guardarEdicion() {
    if (!this.empleadoSeleccionado) {
      this.snackBar.open('⚠️ Seleccione un empleado.', 'Cerrar', { duration: 3000 });
      return;
    }

    const t = this.empleadoSeleccionado;

    if (
      (t.fechaHoraEntrada && this.nominaLock.estaBloquada(t.fechaHoraEntrada)) ||
      (t.fechaHoraSalida  && this.nominaLock.estaBloquada(t.fechaHoraSalida))
    ) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      return;
    }

    const tareas: Observable<void>[] = [];

    if (t.fechaHoraEntrada && t.ingresoId != null) {
      tareas.push(this.tiemposService.actualizarIngreso(t.ingresoId, {
        id: t.ingresoId,
        empleadoId: t.empleadoId,
        fechaHoraEntrada: t.fechaHoraEntrada,
        comentarios: t.comentarios,
        permisosEspeciales: ''
      }));
    }
    if (t.fechaHoraSalida && t.salidaId != null) {
      tareas.push(this.tiemposService.actualizarSalida(t.salidaId, {
        id: t.salidaId,
        empleadoId: t.empleadoId,
        fechaHoraSalida: t.fechaHoraSalida,
        comentarios: t.comentarios,
        permisosEspeciales: ''
      }));
    }

    forkJoin(tareas).subscribe({
      next: () => {
        this.snackBar.open('✅ Tiempo actualizado correctamente.', 'Cerrar', { duration: 3000 });
        this.empleadoSeleccionado = null;
        setTimeout(() => location.reload(), 500);
      },
      error: (err) => {
        if (err.status === 422) {
          const msg = err.error?.mensaje ?? this.nominaLock.MENSAJE_BLOQUEO;
          this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
        } else if (err.status === 409) {
          this.snackBar.open('⚠️ Ya existe un registro similar.', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('❌ Error inesperado al guardar.', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  cancelarEdicion() {
    this.empleadoSeleccionado = null;
  }

  eliminarRegistroCompleto(registro: TiempoExtendido) {
    if (!confirm(`⚠️ ¿Seguro que quieres eliminar TODO el registro de ${registro.nombreEmpleado}?`)) return;

    const entradaBloqueada = registro.fechaHoraEntrada && this.nominaLock.estaBloquada(registro.fechaHoraEntrada);
    const salidaBloqueada  = registro.fechaHoraSalida  && this.nominaLock.estaBloquada(registro.fechaHoraSalida);

    if (entradaBloqueada || salidaBloqueada) {
      this.snackBar.open(this.nominaLock.MENSAJE_BLOQUEO, 'Cerrar', { duration: 6000 });
      return;
    }

    const operaciones: Observable<void>[] = [];
    if (registro.ingresoId) operaciones.push(this.tiemposService.eliminarIngreso(registro.ingresoId));
    if (registro.salidaId)  operaciones.push(this.tiemposService.eliminarSalida(registro.salidaId));

    if (operaciones.length === 0) {
      this.snackBar.open('❌ No hay registros válidos para eliminar.', 'Cerrar', { duration: 3000 });
      return;
    }

    forkJoin(operaciones).subscribe({
      next: () => {
        this.snackBar.open('✅ Registro eliminado correctamente.', 'Cerrar', { duration: 3000 });
        if (registro.empleadoId) this.cargarTodosLosRegistrosDelEmpleado(registro.empleadoId);
      },
      error: (err) => {
        if (err.status === 422) {
          const msg = err.error?.mensaje ?? this.nominaLock.MENSAJE_BLOQUEO;
          this.snackBar.open(msg, 'Cerrar', { duration: 7000 });
        } else {
          this.snackBar.open('❌ Error al eliminar el registro.', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  cargarTodosLosRegistrosDelEmpleado(empleadoId: number) {
    forkJoin({
      ingresos: this.tiemposService.obtenerIngresosPorEmpleado(empleadoId),
      salidas:  this.tiemposService.obtenerSalidasPorEmpleado(empleadoId)
    }).subscribe({
      next: ({ ingresos, salidas }) => {
        ingresos = Array.isArray(ingresos) ? ingresos.slice() : [];
        salidas  = Array.isArray(salidas)  ? salidas.slice()  : [];

        const getTime = (fecha?: string | null) => fecha ? new Date(fecha).getTime() : null;

        ingresos.sort((a, b) => (getTime(a.fechaHoraEntrada) ?? 0) - (getTime(b.fechaHoraEntrada) ?? 0));
        salidas.sort((a, b) => (getTime(a.fechaHoraSalida) ?? 0) - (getTime(b.fechaHoraSalida) ?? 0));

        const combinados: TiempoExtendido[] = [];
        const usadas: Set<number> = new Set();

        for (let ingreso of ingresos) {
          const entradaTime = getTime(ingreso.fechaHoraEntrada);
          if (entradaTime === null) {
            combinados.push(this.crearTiempoVacio(empleadoId, ingreso.id ?? null, null, null, null, ingreso.comentarios ?? ''));
            continue;
          }

          const salidaIndex = salidas.findIndex(s => {
            const salidaTime = getTime(s.fechaHoraSalida);
            if (salidaTime === null || s.id == null || usadas.has(s.id)) return false;
            const fechaEntrada = new Date(ingreso.fechaHoraEntrada!);
            const fechaSalida  = new Date(s.fechaHoraSalida!);
            const mismoDia = fechaEntrada.toDateString() === fechaSalida.toDateString();
            const siguienteDia = new Date(fechaEntrada);
            siguienteDia.setDate(fechaEntrada.getDate() + 1);
            const esSiguienteDia = fechaSalida.getFullYear() === siguienteDia.getFullYear() &&
                                   fechaSalida.getMonth() === siguienteDia.getMonth() &&
                                   fechaSalida.getDate() === siguienteDia.getDate();
            return salidaTime >= entradaTime && (mismoDia || esSiguienteDia);
          });

          if (salidaIndex !== -1) {
            const salida = salidas[salidaIndex];
            combinados.push(this.crearTiempoVacio(empleadoId, ingreso.id ?? null, salida.id ?? null,
              ingreso.fechaHoraEntrada ?? null, salida.fechaHoraSalida ?? null,
              ingreso.comentarios ?? salida.comentarios ?? ''));
            usadas.add(salida.id!);
          } else {
            combinados.push(this.crearTiempoVacio(empleadoId, ingreso.id ?? null, null,
              ingreso.fechaHoraEntrada ?? null, null, ingreso.comentarios ?? ''));
          }
        }

        for (let salida of salidas) {
          if (!usadas.has(salida.id!)) {
            combinados.push(this.crearTiempoVacio(empleadoId, null, salida.id ?? null,
              null, salida.fechaHoraSalida ?? null, salida.comentarios ?? ''));
          }
        }

        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const añoActual = ahora.getFullYear();
        const inicioMesAnterior = new Date(añoActual, mesActual - 2, 1, 0, 0, 0);
        const finMes = new Date(añoActual, mesActual + 1, 0, 23, 59, 59);

        this.empleadoSeleccionadoHistorial = combinados.filter(t => {
          const fEntrada = t.fechaHoraEntrada ? new Date(t.fechaHoraEntrada) : null;
          const fSalida  = t.fechaHoraSalida  ? new Date(t.fechaHoraSalida)  : null;
          return (
            (fEntrada && fEntrada >= inicioMesAnterior && fEntrada <= finMes) ||
            (fSalida  && fSalida  >= inicioMesAnterior && fSalida  <= finMes) ||
            (fEntrada && fSalida  && fEntrada < inicioMesAnterior && fSalida > finMes)
          );
        });
      },
      error: (err) => console.error('❌ Error cargando historial:', err)
    });
  }

  private crearTiempoVacio(
    empleadoId: number,
    ingresoId: number | null,
    salidaId: number | null,
    entrada: string | null,
    salida: string | null,
    comentarios: string
  ): TiempoExtendido {
    return {
      ingresoId,
      salidaId,
      empleadoId,
      nombreEmpleado: this.empleadosSeleccionados.find(e => e.id === empleadoId)?.nombreEmpleado ?? '',
      fechaHoraEntrada: entrada,
      fechaHoraSalida: salida,
      comentarios,
      permisosEspeciales: '',
      sinProgramacion: false,
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
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private construirFechaUTC(fecha: string, hora: string): string {
    // Enviamos la hora local directamente sin conversión de zona horaria
    return `${fecha}T${hora}:00`;
  }

  toggleExpandido(reg: TiempoExtendido): void {
    reg.expandido = !reg.expandido;
  }

  // Estadísticas del panel
  get totalEmpleados(): number { return this.listaTiempos.length; }
  get totalConIngreso(): number { return this.listaTiempos.filter(r => r.horaIngreso).length; }
  get totalConSalida(): number  { return this.listaTiempos.filter(r => r.horaSalida).length; }
  get totalBloqueados(): number { return this.listaTiempos.filter(r => r.sinProgramacion && !this.esEspecial).length; }
}

