import { Component, OnInit, inject,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { Empleado,EmpleadoService } from '../../services/empleado-service.service';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { AuthService } from '../../services/auth.service';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService, User } from '../../services/user.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  standalone: true,
  imports: [FormsModule, CommonModule, NavbarComponent, BotonRegresarComponent]
})
export class InventarioComponent implements OnInit {
  empleados: Empleado[] = [];

  materiales: Inventario[] = [];
  materialesFiltrados: Inventario[] = [];
  searchQuery: string = '';

  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';

  materialActual: Inventario = this.crearNuevoItem();

  usuarios: User[] = [];
  obras: Obra[] = [];
  responsables: User[] = [];

  pageSize = 30;
  currentPage = 1;

  totalHerramientas = 0;
  stockTotal = 0;
  stockReservado = 0;
  stockDisponible = 0;

@HostListener('document:keydown.escape')
onEscape() {
  if (this.mostrarFormulario) {
    this.cerrarFormulario();
  }
}

 

  private inventarioService = inject(InventarioService);
  private authService       = inject(AuthService);
  private obraService       = inject(ObraService);
  private userService       = inject(UserService);
  private route             = inject(ActivatedRoute);
  private router            = inject(Router);
  private empleadoService = inject(EmpleadoService);
  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('[InventarioComponent] ngOnInit');
    this.obtenerInventario();
    this.cargarObras();
    this.cargarUsuarios();
    this.cargarEmpleados();
    window.addEventListener('resize', () => this.cd.detectChanges());
  }

  cargarEmpleados(): void {
  this.empleadoService.obtenerEmpleados(1, 500).subscribe({
    next: data => {
      this.empleados = data.filter(e => e.estado === 'Activo'); // opcional
    },
    error: err => console.error(err)
  });
}

getStockClass(material: any): string {

  const reservado = material.stockReservado || 0;
  const disponible = material.cantidad - reservado;

  if (disponible <= 2) {
    return 'stock-critico';
  }

  if (disponible <= 5) {
    return 'stock-bajo';
  }

  return 'stock-normal';
}
  
 obtenerInventario(): void {
  console.log('[InventarioComponent] obtenerInventario: solicitando lista...');
  this.inventarioService.obtenerInventario().subscribe({
    next: data => {

      this.materiales = data;

      // 🔹 KPI
      this.totalHerramientas = data.length;

      this.stockTotal = data.reduce(
        (sum, m) => sum + (m.cantidad || 0),
        0
      );

      this.stockReservado = data.reduce(
        (sum, m) => sum + (m.stockReservado || 0),
        0
      );

      this.stockDisponible = data.reduce(
        (sum, m) => sum + (m.stockDisponible ?? m.cantidad),
        0
      );

      this.filtrarMateriales();
    },
    error: err => console.error(err)
  });
}

  cargarObras(): void {
    this.obraService.getObras().subscribe({
      next: data => this.obras = data,
      error: err => console.error(err)
    });
  }

  cargarUsuarios(): void {
    this.userService.getAllUsers().subscribe({
      next: data => this.responsables = data.filter(u => u.rol === 'responsable' && u.estado==='Activo'),
      error: err => console.error(err)
    });
  }

 filtrarMateriales(): void {
  const q = this.searchQuery.trim().toLowerCase();

  this.materialesFiltrados = this.materiales.filter(item =>
    (item.codigo || '').toLowerCase().includes(q) ||
    (item.herramienta || '').toLowerCase().includes(q) ||
    (item.marca || '').toLowerCase().includes(q) ||
    (item.numeroSerie || '').toLowerCase().includes(q) ||
    (item.responsable || '').toLowerCase().includes(q) ||
    (item.ubicacion || '').toLowerCase().includes(q) ||
    (item.estado || '').toLowerCase().includes(q)
  );

  this.materialesFiltrados.sort((a, b) => {
    const na = Number(a.codigo);
    const nb = Number(b.codigo);
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
  });

  this.currentPage = 1;
}

  get pages(): number[] {
    const total = Math.ceil(this.materialesFiltrados.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
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


  setPage(page: number): void {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
  }

  trackById(_: number, item: Inventario): number {
    return item.id;
  }

  mostrarFormularioMaterial(material?: Inventario): void {
    if (material) {
      this.materialActual = { ...material };
      this.esEdicion = true;
    } else {
      this.materialActual = this.crearNuevoItem();
      this.esEdicion = false;
    }
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

guardarMaterial(): void {
  const obs = this.esEdicion
    ? this.inventarioService.actualizarItem(this.materialActual)
    : this.inventarioService.agregarItem(this.materialActual);

  obs.subscribe({
    next: () => {
      this.mostrarMensaje('Guardado exitosamente', 'success');
      this.obtenerInventario();
      setTimeout(() => {
        this.cerrarFormulario();
      }, 3000);
    },
    error: err => {
      console.error(err);
      this.mostrarMensaje('Error al guardar', 'error');
    }
  });
}

mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
  this.mensaje = mensaje;
  this.tipoMensaje = tipo;
  setTimeout(() => {
    this.mensaje = '';
    this.tipoMensaje = '';
  }, 3000);
}


  eliminarHerramienta(id: number): void {
    if (!confirm('¿eliminar herramienta?')) return;
    this.inventarioService.eliminarItem(id).subscribe({
      next: () => this.obtenerInventario(),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private crearNuevoItem(): Inventario {
    return {
      id: 0,
      codigo: '',
      herramienta: '',
      numeroSerie: '',
      marca: '',
      modulo: '',
      nivel: '',
      observaciones: '',
      ubicacion: '',
      responsable: '',
      estado: 'Activo',
      cantidad: 1
    };
  }

  irAInventarioInterno(nombreObra: string): void {
    const nombreSanitizado = encodeURIComponent(nombreObra);
    this.router.navigate(['/inventario-interno', nombreSanitizado]).then(success => {
    });
  }

   exportarExcel(): void {

  const aoa: any[][] = [];

  aoa.push([
    '#','Código','Herramienta','Marca','Serie','Cantidad',
    'Ubicación','Responsable','Proveedor','Garantía'
  ]);

  this.materialesFiltrados.forEach((m, idx) => {
    aoa.push([
      idx + 1,
      m.codigo,
      m.herramienta,
      m.marca || '-',
      m.numeroSerie || '-',
      m.cantidad,
      m.ubicacion,
      m.responsable,
      m.modulo || '-',
      m.nivel || '-'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const nombre = `Inventario_Completo.xlsx`;

  saveAs(new Blob([wbout], { type: 'application/octet-stream' }), nombre);
}
}
