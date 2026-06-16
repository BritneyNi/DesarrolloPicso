import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { forkJoin, of, combineLatest, from } from 'rxjs';
import { map, catchError, concatMap, toArray } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { TiemposService, Tiempo } from '../../services/tiempos.service.service';
import { AusentismoService, TiempoAusentismo } from '../../services/documento-permiso.service';
import { ProgramacionSemanalService } from '../../services/programacion-semanal.service';

import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ListaTiemposComponent } from '../../lista-tiempos/lista-tiempos.component';

type EstadoTemporal =
  | 'ingreso-salida'
  | 'solo-ingreso'
  | 'falta-ingreso'
  | 'sin-tiempos'
  | 'ausentismo';

@Component({
  selector: 'app-gestion-personal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListaTiemposComponent,
    NavbarComponent,
    BotonRegresarComponent
  ],
  templateUrl: './gestion-personal.component.html',
  styleUrls: ['./gestion-personal.component.css']
})
export class GestionPersonalComponent implements OnInit {

  // =========================
  // STATE
  // =========================
  responsable = '';
  rol = '';
  obraId = '';
  obraIdNumerico: number | null = null;
  obraNombre = '';
  residenteId: number | null = null;

  esEspecial = false;

  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];

  empleadosSeleccionados: {
    id: number;
    nombreEmpleado: string;
    obra: string;
  }[] = [];

  searchQuery = '';
  todosSeleccionados = false;
  filtroEstado: EstadoTemporal | null = null;

  guardandoTiempos = false;

  empSeleccionadoVista: Empleado | null = null;
  historialEmpleado: any[] = [];

  cargandoHistorial = false;

  tieneProgramacion = true;
  verificandoProgramacion = false;

  // =========================
  // SERVICES
  // =========================
  private authService        = inject(AuthService);
  private empleadoService    = inject(EmpleadoService);
  private tiemposService     = inject(TiemposService);
  private ausentismoService  = inject(AusentismoService);
  private programacionService = inject(ProgramacionSemanalService);
  private router             = inject(Router);
  private route              = inject(ActivatedRoute);

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    const usuarioJson = localStorage.getItem('usuario');

    if (usuarioJson) {
      const { nombreCompleto, rol, obra } = JSON.parse(usuarioJson);
      this.responsable = nombreCompleto;
      this.rol = rol;
      this.obraId = rol === 'responsable' ? obra : '';
      this.esEspecial = rol?.toUpperCase() === 'ADMIN';
}

    const obraIdStr = localStorage.getItem('obra-id');
    if (obraIdStr) this.obraIdNumerico = Number(obraIdStr);

    const usuarioIdStr = localStorage.getItem('usuario-id');
    if (usuarioIdStr) this.residenteId = Number(usuarioIdStr);

    this.route.paramMap.subscribe(params => {
      const raw = params.get('nombreObra');
      if (raw) {
        this.obraNombre = decodeURIComponent(raw).replace(/-/g, ' ');
      }
      this.verificarProgramacionSemanal();
      this.obtenerTodosEmpleados();
    });
  }

  // =========================
  // PROGRAMACIÓN
  // =========================
  private verificarProgramacionSemanal(): void {
    if (this.esEspecial) {
      this.tieneProgramacion = true;
      return;
    }

    if (!this.obraIdNumerico) return;

    this.verificandoProgramacion = true;

    this.programacionService.getSemanaActual(this.obraIdNumerico)
      .pipe(catchError(() => of([])))
      .subscribe({
        next: (data: any[]) => {
          this.tieneProgramacion = data.length > 0;
          this.verificandoProgramacion = false;
        },
        error: () => {
          this.tieneProgramacion = true;
          this.verificandoProgramacion = false;
        }
      });
  }

  irAProgramar(): void {
    if (!this.obraIdNumerico || !this.obraNombre) return;
    this.router.navigate([
      '/programacion-semanal',
      this.obraIdNumerico,
      encodeURIComponent(this.obraNombre)
    ]);
  }

  // =========================
  // CARGAR / REFRESCAR
  // =========================
  cargarTiempos(): void {
    this.obtenerTodosEmpleados();
  }

  onTiemposActualizados(): void {
    this.obtenerTodosEmpleados();
  }

  // =========================
  // EMPLEADOS
  // =========================
  private obtenerTodosEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 500)
      .subscribe((data: Empleado[]) => {
        let lista = data.filter(e => e.estado === 'Activo');

        const normalizar = (t?: string) =>
          t?.toLowerCase().replace(/-/g, ' ').trim();

        if (!this.esEspecial && this.obraNombre) {
          lista = lista.filter(emp =>
            normalizar(emp.obra) === normalizar(this.obraNombre)
          );
        }

        this.empleados = lista.sort((a, b) =>
          a.nombreCompleto.localeCompare(b.nombreCompleto)
        );

        this.cargarDatosParaTodos();
      });
  }

  private cargarDatosParaTodos(): void {
    this.ausentismoService.getDocumentos()
      .subscribe((permisos: TiempoAusentismo[]) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const requests = this.empleados.map(emp => {
          const ing$ = this.tiemposService
            .obtenerUltimoIngresoPorEmpleado(emp.id)
            .pipe(catchError(() => of(null)));

          const sal$ = this.tiemposService
            .obtenerUltimaSalidaPorEmpleado(emp.id)
            .pipe(catchError(() => of(null)));

          return combineLatest([ing$, sal$] as const).pipe(
            map(([ing, sal]) => {
              if (ing) emp.fechaHoraEntrada = (ing as any).fechaHoraEntrada ?? null;
              if (sal) emp.fechaHoraSalida  = (sal as any).fechaHoraSalida  ?? null;

              const permiso = permisos.find(p =>
                p.nombreEmpleado === emp.nombreCompleto &&
                new Date(p.fechaInicio) <= hoy &&
                new Date(p.fechaFin) >= hoy
              );

              emp.estadoTemporario =
                permiso ? 'ausentismo' : this.calcularEstado(emp);

              return emp;
            })
          );
        });

        // Procesar en lotes de 10 para no saturar Azure
        const LOTE = 10;
        const lotes: typeof requests[] = [];
        for (let i = 0; i < requests.length; i += LOTE) {
          lotes.push(requests.slice(i, i + LOTE));
        }

        from(lotes).pipe(
          concatMap(lote => forkJoin(lote)),
          toArray()
        ).subscribe({
          next: (resultados) => {
            this.empleados = resultados.flat();
            this.aplicarFiltro();
          },
          error: () => this.aplicarFiltro()
        });
      });
  }

  // =========================
  // REGISTRO RÁPIDO INLINE
  // =========================
  onCheckboxChange(emp: Empleado): void {
    // Inicializar hora con la hora actual al seleccionar
    if (emp.seleccionado) {
      const ahora = this.horaActualInput();
      if (!emp.horaIngresoManual) emp.horaIngresoManual = ahora;
      if (!emp.horaSalidaManual)  emp.horaSalidaManual  = ahora;
    }
    this.verificarSeleccionIndividual();
  }

  registrarIngresoRapido(emp: Empleado): void {
    if (!emp.horaIngresoManual) return;

    const hoy   = new Date();
    const [h, m] = emp.horaIngresoManual.split(':').map(Number);
    hoy.setHours(h, m, 0, 0);

    const fechaHora = hoy.toISOString();

    this.tiemposService.registrarIngreso({
      empleadoId: emp.id,
      fechaHoraEntrada: fechaHora,
      fechaHoraSalida: null,
      comentarios: '',
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        emp.mensajeIngreso = '✅ Guardado';
        emp.fechaHoraEntrada = fechaHora;
        emp.estadoTemporario = this.calcularEstado(emp);
        setTimeout(() => { emp.mensajeIngreso = ''; }, 3000);
      },
      error: (err) => {
        emp.mensajeIngreso = err?.error?.mensaje ?? '❌ Error';
        setTimeout(() => { emp.mensajeIngreso = ''; }, 4000);
      }
    });
  }

  registrarSalidaRapida(emp: Empleado): void {
    if (!emp.horaSalidaManual) return;

    const hoy   = new Date();
    const [h, m] = emp.horaSalidaManual.split(':').map(Number);
    hoy.setHours(h, m, 0, 0);

    const fechaHora = hoy.toISOString();

    this.tiemposService.registrarSalida({
      empleadoId: emp.id,
      fechaHoraEntrada: null,
      fechaHoraSalida: fechaHora,
      comentarios: '',
      permisosEspeciales: ''
    }).subscribe({
      next: () => {
        emp.mensajeSalida = '✅ Guardado';
        emp.fechaHoraSalida = fechaHora;
        emp.estadoTemporario = this.calcularEstado(emp);
        setTimeout(() => { emp.mensajeSalida = ''; }, 3000);
      },
      error: (err) => {
        emp.mensajeSalida = err?.error?.mensaje ?? '❌ Error';
        setTimeout(() => { emp.mensajeSalida = ''; }, 4000);
      }
    });
  }

  // =========================
  // ESTADOS
  // =========================
  private calcularEstado(emp: Empleado): EstadoTemporal {
    const hoy = new Date();

    const esHoy = (d?: string | null) =>
      !!d && new Date(d).toDateString() === hoy.toDateString();

    const ing = esHoy(emp.fechaHoraEntrada);
    const sal = esHoy(emp.fechaHoraSalida);

    if (ing && sal)  return 'ingreso-salida';
    if (ing && !sal) return 'solo-ingreso';
    if (!ing && hoy.getHours() >= 9) return 'falta-ingreso';

    return 'sin-tiempos';
  }

  contarEstado(estado: EstadoTemporal): number {
    return this.empleadosFiltrados.filter(e => e.estadoTemporario === estado).length;
  }

  etiquetaEstado(e?: EstadoTemporal | string): string {
    switch (e) {
      case 'ingreso-salida': return '✅ Completo';
      case 'solo-ingreso':   return '🟡 Sin salida';
      case 'falta-ingreso':  return '🔴 Sin ingreso';
      case 'ausentismo':     return '🟣 Ausentismo';
      default:               return '⚪ Sin registro';
    }
  }

  obtenerClaseFila(emp: Empleado): string {
    switch (emp.estadoTemporario) {
      case 'ingreso-salida': return 'fila-completo';
      case 'solo-ingreso':   return 'fila-sin-salida';
      case 'falta-ingreso':  return 'fila-sin-ingreso';
      case 'ausentismo':     return 'fila-ausentismo';
      default:               return '';
    }
  }

  esTardio(fechaHora?: string | null): boolean {
    if (!fechaHora) return false;
    const hora = new Date(fechaHora).getHours();
    return hora >= 9;
  }

  // =========================
  // FILTROS
  // =========================
  filtrarPorEstado(e: EstadoTemporal): void {
    this.filtroEstado = this.filtroEstado === e ? null : e;
    this.aplicarFiltro();
  }

  filtrarEmpleados(): void {
    this.aplicarFiltro();
  }

  private aplicarFiltro(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.empleadosFiltrados = this.empleados.filter(emp => {
      const texto = (
        emp.nombreCompleto +
        emp.cedula +
        emp.cargo +
        emp.obra
      ).toLowerCase();

      return (!q || texto.includes(q)) &&
        (!this.filtroEstado || emp.estadoTemporario === this.filtroEstado);
    });
  }

  // =========================
  // CHECKBOX
  // =========================
  toggleSeleccionarTodos(): void {
    this.empleadosFiltrados.forEach(e => e.seleccionado = this.todosSeleccionados);
    this.verificarSeleccionIndividual();
  }

  verificarSeleccionIndividual(): void {
    this.todosSeleccionados =
      this.empleadosFiltrados.every(e => e.seleccionado);

    this.empleadosSeleccionados =
      this.empleadosFiltrados
        .filter(e => e.seleccionado)
        .map(e => ({
          id: e.id,
          nombreEmpleado: e.nombreCompleto,
          obra: e.obra
        }));
  }

  // =========================
  // UTIL
  // =========================
  horaActualInput(): string {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  subirAlInicio(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bajarAlFinal(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
