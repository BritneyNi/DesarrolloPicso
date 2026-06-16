import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { InventarioInternoService, InventarioInterno } from '../../services/inventario-interno.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { AuthService } from '../../services/auth.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { Empleado, EmpleadoService } from '../../services/empleado-service.service';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChangeDetectorRef } from '@angular/core';
import { MovimientoService } from '../../services/movimiento-service.service';

interface FilaMezclada {
  tipo: 'padre' | 'hijo';
  id: number;
  internoId?: number;
  codigo?: string;
  herramienta?: string;
  marca?: string;
  numeroSerie?: string;
  cantidad?: number;
  ubicacion?: string;
  responsable?: string;
  usando?: string;
  cantidadAsignada?: number;
  observaciones?: string;
}

@Component({
  selector: 'app-inventario-interno',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './inventario-interno.component.html',
  styleUrls: ['./inventario-interno.component.css']
})
export class InventarioInternoComponent implements OnInit {
  /** Datos */
  registros: InventarioInterno[] = [];
  inventarioPadre: Inventario[] = [];

  /** Para el formulario */
  nombreResponsable = '';
  obraUsuario: string | null = null;
  registroActual: InventarioInterno = this.nuevoRegistro();
  herramientaNombre = '';
  marca = '';
  numeroSerie = '';
  cantidad = 0;
  esEdicion = false;
  mostrarFormulario = false;

  /** Búsqueda y paginación */
  searchQuery = '';
  pageSize = 10;
  currentPage = 1;

  /** Empleados para autocomplete */
  empleados: Empleado[] = [];
  usandoInput = '';
  usandoFiltrado: Empleado[] = [];

  /** Servicios */
  private inventarioService = inject(InventarioService);
  private inventarioInternoService = inject(InventarioInternoService);
  private authService = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private movimientoService = inject(MovimientoService);
  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    // 1) Obtén nombreResponsable del token (solo para mostrar en el modal)
    const user = this.authService.getUserData();
    if (user) {
      this.nombreResponsable =
        user['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        user.name ||
        ''; 
    window.addEventListener('resize', () => this.cd.detectChanges());
    }

    // 2) Lee nombreObra de la ruta y carga datos
   this.route.paramMap.subscribe(params => {

  const obraParam = params.get('nombreObra');
  if (obraParam) {
    this.obraUsuario = decodeURIComponent(obraParam);
  }

  this.cargarEmpleados();

  if (this.obraUsuario) {

    this.inventarioService.obtenerPorObra(this.obraUsuario!).subscribe(padre => {

  this.inventarioPadre = padre;

  this.inventarioInternoService.obtenerPorObra(this.obraUsuario!).subscribe(internos => {

  this.registros = internos;

  });

});

  }

});
  }

  /** Obtiene los registros internos filtrados por obra */
 private cargarRegistrosInternos(): void {
  if (!this.obraUsuario) return;

  this.inventarioInternoService.obtenerPorObra(this.obraUsuario).subscribe({
    next: data => {
      const vistos = new Set<string>();

      this.registros = data
        // 🔹 solo registros cuya herramienta exista en el inventario de la obra
        .filter(r => this.inventarioPadre.some(p => p.id === r.inventarioId))
        // 🔹 eliminar duplicados
        .filter(r => {
          const clave = `${r.inventarioId}-${r.usando?.toLowerCase().trim()}-${r.obra?.toLowerCase().trim()}`;
          if (vistos.has(clave)) return false;
          vistos.add(clave);
          return true;
        });
    },
    error: err => console.error('Error internos ▶', err)
  });
}


  /** Obtiene el inventario padre filtrado por obra */
private cargarInventarioPadre(): void {
  if (!this.obraUsuario) return;

  this.inventarioService.obtenerPorObra(this.obraUsuario).subscribe({
    next: data => {
     
      this.inventarioPadre = data;

      this.currentPage = 1;
    },
    error: err => console.error('Error padre ▶', err)
  });
}


  /** Carga lista de empleados para autocomplete */
  private cargarEmpleados(): void {
  this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
    next: data => {
      // Solo empleados cuyo estado sea "Activo"
      this.empleados = data.filter(emp => emp.estado === 'Activo');
      this.usandoFiltrado = [...this.empleados]; // inicializa el autocomplete
    },
    error: err => console.error('Error empleados ▶', err)
  });
}

filtrarUsando(): void {
  const q = this.usandoInput.toLowerCase();
  this.usandoFiltrado = this.empleados
    .filter(e => e.estado === 'Activo') // doble chequeo por seguridad
    .filter(e => e.nombreCompleto.toLowerCase().includes(q));
}

  /** Muestra modal de asignación o edición */
  mostrarFormularioAsignacion(fila: FilaMezclada): void {
    this.esEdicion = !!fila.internoId;
    this.registroActual = {
      ...this.nuevoRegistro(),
      id: fila.internoId || 0,
      inventarioId: fila.id,
      obra: this.obraUsuario!,
      responsableObra: fila.responsable || this.nombreResponsable,
      usando:'',
      cantidadAsignada: fila.cantidadAsignada || 1,
      observaciones: fila.observaciones || ''
    };
    this.herramientaNombre = fila.herramienta!;
    this.marca = fila.marca || '';
    this.numeroSerie = fila.numeroSerie!;
    this.cantidad = fila.cantidad!;
    this.mostrarFormulario = true;
  }

  /** Guarda o actualiza la asignación */
  guardarAsignacion(): void {

    if (!this.registroActual.inventarioId || !this.registroActual.usando) return;

    const action$ = this.esEdicion
      ? this.inventarioInternoService.actualizarItem(this.registroActual)
      : this.inventarioInternoService.agregarItem(this.registroActual);

    action$.subscribe({
      next: () => {
        this.cargarRegistrosInternos();
        if (this.obraUsuario) this.cargarInventarioPadre();
        this.cerrarModal();
      },
      error: err => console.error('Error guardar ▶', err)
    });
  }

  /** Edita una asignación existente */
  editarAsignacion(fila: FilaMezclada): void {
    if (fila.internoId) this.mostrarFormularioAsignacion(fila);
  }

  /** Fusiona padre + hijos para el template */
get filasMezcladas(): FilaMezclada[] {

  const filas: FilaMezclada[] = [];

  // 1️⃣ recorrer inventario padre
  for (const padre of this.inventarioPadre) {

    const hijos = this.registros.filter(r => r.inventarioId === padre.id);

    if (hijos.length === 0) {
      filas.push({
        tipo: 'padre',
        id: padre.id,
        codigo: padre.codigo,
        herramienta: padre.herramienta,
        marca: padre.marca,
        numeroSerie: padre.numeroSerie,
        cantidad: padre.cantidad,
        ubicacion: padre.ubicacion,
        responsable: padre.responsable
      });
    } else {
      for (const hijo of hijos) {
        filas.push({
          tipo: 'hijo',
          id: padre.id,
          internoId: hijo.id,
          codigo: padre.codigo,
          herramienta: padre.herramienta,
          marca: padre.marca,
          numeroSerie: padre.numeroSerie,
          cantidad: hijo.cantidadAsignada,
          ubicacion: hijo.obra,
          responsable: hijo.responsableObra,
          usando: hijo.usando,
          cantidadAsignada: hijo.cantidadAsignada,
          observaciones: hijo.observaciones
        });
      }
    }
  }

  // 2️⃣ agregar internos que no tengan padre
  for (const interno of this.registros) {

    const existe = this.inventarioPadre.some(p => p.id === interno.inventarioId);

    if (!existe) {

      filas.push({
        tipo: 'hijo',
        id: interno.inventarioId,
        internoId: interno.id,
        codigo: interno.inventario?.codigo,
        herramienta: interno.inventario?.herramienta,
        marca: interno.inventario?.marca,
        numeroSerie: interno.inventario?.numeroSerie,
        cantidad: interno.cantidadAsignada,
        ubicacion: interno.obra,
        responsable: interno.responsableObra,
        usando: interno.usando,
        cantidadAsignada: interno.cantidadAsignada,
        observaciones: interno.observaciones
      });

    }

  }

  return filas;
}

  private crearFila(p: Inventario, h: InventarioInterno | null): FilaMezclada {
    return {
      tipo: 'padre',
      id: p.id,
      internoId: h?.id,
      codigo: p.codigo,
      herramienta: p.herramienta,
      marca: p.marca,
      numeroSerie: p.numeroSerie,
      cantidad: p.cantidad,
      ubicacion: p.ubicacion,
      responsable: p.responsable,
      usando: h?.usando || '',
      cantidadAsignada: h?.cantidadAsignada,
      observaciones: h?.observaciones || ''
    };
  }

  /** Paginación local y búsqueda */
  get inventarioPaginado(): Inventario[] {
    const q = this.searchQuery.trim().toLowerCase();
    const lista = this.inventarioPadre.filter(i =>
      i.codigo.toLowerCase().includes(q) ||
      i.herramienta.toLowerCase().includes(q) ||
      i.marca.toLowerCase().includes(q) ||
      (i.numeroSerie || '').toLowerCase().includes(q) ||
      i.ubicacion.toLowerCase().includes(q)
    );
    const start = (this.currentPage - 1) * this.pageSize;
    return lista.slice(start, start + this.pageSize);
  }

  setPage(p: number): void {
    this.currentPage = p;
  }

  get paginatedPages(): number[] {
  const totalPages = this.pages.length;
    if (window.innerWidth <= 600) {
      const blockSize = 5;
      const currentBlock = Math.floor((this.currentPage - 1) / blockSize);
      const start = currentBlock * blockSize + 1;
      const end = Math.min(start + blockSize - 1, totalPages);

      return this.pages.slice(start - 1, end);
    }
    return this.pages;
  }

  get pages(): number[] {
    return Array.from(
      { length: Math.ceil(this.inventarioPadre.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  irASolicitudes(): void {
  if (!this.obraUsuario) return;

  const obra = encodeURIComponent(this.obraUsuario);

  this.router.navigate(['/solicitudes'], {
    queryParams: { obra: obra }
  });
}

  trackById(index: number, f: FilaMezclada): any {
  return f.internoId ?? f.id;
}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private nuevoRegistro(): InventarioInterno {
    return { id: 0, inventarioId: 0, obra: '', responsableObra: '', usando: '', cantidadAsignada: 1, observaciones: '' };
  }

  cerrarModal(): void {
    this.mostrarFormulario = false;
    this.esEdicion = false;
    this.registroActual = this.nuevoRegistro();
  }

   exportarExcel() {
    const filas: FilaMezclada[] = this.filasMezcladas;

    const aoa: any[][] = [];
    aoa.push([
      'Código','Herramienta','Marca','Serie','Cantidad',
      'Ubicación','Responsable','Usando','Observaciones'
    ]);
    filas.forEach(f => {
      aoa.push([
        f.codigo ?? '-',
        f.herramienta ?? '-',
        f.marca ?? '-',
        f.numeroSerie ?? '-',
        f.cantidad ?? '-',
        f.ubicacion ?? '-',
        f.responsable ?? '-',
        f.usando ?? '-',
        f.observaciones ?? '-'
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Inventario_${this.obraUsuario || 'Todos'}.xlsx`);
  }

  
devolverHerramienta(fila: FilaMezclada) {

  if (!confirm("¿Devolver herramienta al inventario?")) return;

  const responsableFinal =
    this.nombreResponsable?.trim() ||
    fila.responsable ||
    "Sistema";

  const movimiento = {
    inventarioId: fila.id,
    codigoHerramienta: fila.codigo || '',
    nombreHerramienta: fila.herramienta || '',
    tipoMovimiento: "Entrada",
    cantidad: fila.cantidadAsignada || 1,
    obra: this.obraUsuario || '',
    responsable: responsableFinal,
    fechaMovimiento: new Date().toISOString(),
    estado: "Disponible"
  };

  this.movimientoService.crearMovimiento(movimiento).subscribe({
    next: () => {

      if (fila.internoId) {
        this.registros = this.registros.filter(r => r.id !== fila.internoId);
      }

      // 🔥 cargar padre primero
      this.inventarioService.obtenerPorObra(this.obraUsuario!).subscribe(padre => {

        this.inventarioPadre = padre;

        // 🔥 luego cargar internos
        this.inventarioInternoService.obtenerPorObra(this.obraUsuario!).subscribe(internos => {

          this.registros = internos;

        });

      });

    },
    error: err => console.error("Error devolviendo herramienta", err)
  });

}
}
