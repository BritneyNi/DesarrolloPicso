import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RendimientoService, Rendimiento } from '../../services/rendimiento.service';
import { EmpleadoService } from '../../services/empleado-service.service';
import { ContratistaService, Contratista } from '../../services/contratista.service';
import { ObraService, Obra } from '../../services/obras.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rendimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    BotonRegresarComponent
  ],
  templateUrl: './rendimiento.component.html',
  styleUrls: ['./rendimiento.component.css']
})
export class RendimientoComponent implements OnInit {
  rendimiento: Rendimiento = {
    id: 0,
    idEmpleado: 0,
    actividad: '',
    dias: 0,
    unidad: '',
    cantidad: 0,
    observaciones: '',
    idContratista: 0,
    obraId: 0,
  };

  destinatarioTipo = '';
  actividades: string[] = [];
  unidades: string[] = [];
  empleados: { id: number; nombre: string }[] = [];
  contratistas: { id: number; nombre: string }[] = [];
  obras: Obra[] = [];
  cargo = '';

  /** Listas completas para filtrar localmente */
  private empleadosFull: { id: number; nombre: string; obra: string }[] = [];
  private contratistasFull: Contratista[] = [];

  nuevoContratista: Omit<Contratista, 'id'> = {
    nombre: '',
    cedula: '',
    telefono: '',
    obraId: 0
  };
  mostrarModalContratista = false;

  isAdmin = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private obraService: ObraService,
    private rendimientoService: RendimientoService,
    private empleadoService: EmpleadoService,
    private contratistaService: ContratistaService
  ) {}

  ngOnInit(): void {
    // 0) Cargo rol de usuario para habilitar select de obra
    const userJson = localStorage.getItem('usuario');
    if (userJson) {
      const { rol } = JSON.parse(userJson);
      this.isAdmin = (rol === 'admin');
    }

    // 1) Cargo listado de obras y luego preselecciono desde la ruta
    this.obraService.getObras().subscribe({
      next: obras => {
        this.obras = obras;
        this.preseleccionarObraDesdeRuta();
      },
      error: () => alert('Error al cargar obras')
    });

    // 2) Resto de cargas
    this.cargarActividades();
    this.cargarUnidades();
    this.cargarEmpleados();
    this.cargarContratistas();
  }

  private preseleccionarObraDesdeRuta() {
    this.route.paramMap.subscribe(params => {
      const raw = params.get('nombreObra');
      if (!raw) return;
      const buscada = decodeURIComponent(raw).replace(/-/g, ' ');
      const encontrada = this.obras.find(o => o.nombreObra === buscada);
      if (encontrada) {
        this.rendimiento.obraId = encontrada.id;
      }
      // tras preselección, aplico filtro
      this.onObraChange();
    });
  }

  cargarActividades(): void {
    this.rendimientoService.obtenerActividades().subscribe({
      next: res => this.actividades = res,
      error: () => alert('Error al cargar actividades')
    });
  }

  cargarUnidades(): void {
    this.rendimientoService.obtenerUnidades().subscribe({
      next: res => this.unidades = res,
      error: () => alert('Error al cargar unidades')
    });
  }

  irAVerRendimiento(): void {
    this.router.navigate(['/ver-rendimientos']);
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 150).subscribe({
      next: data => {
        // guardo lista completa con el campo obra
        this.empleadosFull = data.map(e => ({
          id: e.id,
          nombre: e.nombreCompleto,
          obra: e.obra
        }));
        this.onObraChange();
      },
      error: () => alert('Error al cargar empleados')
    });
  }

  cargarContratistas(): void {
    this.contratistaService.obtenerTodos().subscribe({
      next: data => {
        this.contratistasFull = data;
        this.onObraChange();
      },
      error: () => alert('Error al cargar contratistas')
    });
  }

  /** Filtra empleados y contratistas en base a obraId */
  onObraChange(): void {
    const idObra = this.rendimiento.obraId;

    if (this.isAdmin) {
      // Si es admin, no se filtra por obra
      this.empleados = this.empleadosFull.map(e => ({
        id: e.id,
        nombre: e.nombre
      }));
      this.contratistas = this.contratistasFull.map(c => ({
        id: c.id,
        nombre: c.nombre
      }));
    } else if (idObra) {
      const nombreObra = this.obras.find(o => o.id === idObra)?.nombreObra ?? '';
      this.empleados = this.empleadosFull
        .filter(e => e.obra === nombreObra)
        .map(e => ({ id: e.id, nombre: e.nombre }));
      this.contratistas = this.contratistasFull
        .filter(c => c.obraId === idObra)
        .map(c => ({ id: c.id, nombre: c.nombre }));
    } else {
      this.empleados = [];
      this.contratistas = [];
    }

    // limpio selecciones previas
    this.destinatarioTipo = '';
    this.rendimiento.idEmpleado = 0;
    this.rendimiento.idContratista = 0;
  }

  abrirModalContratista(): void {
    this.nuevoContratista = {
      nombre: '',
      cedula: '',
      telefono: '',
      obraId: this.rendimiento.obraId
    };
    this.mostrarModalContratista = true;
  }

  cerrarModalContratista(): void {
    this.mostrarModalContratista = false;
  }

  guardarNuevoContratista(): void {
    const { nombre, cedula, telefono, obraId } = this.nuevoContratista;
    if (!nombre || !cedula || !telefono || !obraId) {
      return alert('Todos los campos del contratista y la obra son obligatorios.');
    }
    this.contratistaService.crear(this.nuevoContratista).subscribe({
      next: nuevo => {
        this.contratistasFull.push(nuevo);
        this.onObraChange();
        this.rendimiento.idContratista = nuevo.id;
        this.mostrarModalContratista = false;
      },
      error: () => alert('Error al guardar contratista')
    });
  }

  guardarRendimiento(): void {
    if (!this.rendimiento.obraId) {
      return alert('Debe seleccionar una obra.');
    }
    if (!this.rendimiento.actividad || !this.rendimiento.unidad) {
      return alert('Debe seleccionar actividad y unidad.');
    }
    if (this.destinatarioTipo === 'empleado' && !this.rendimiento.idEmpleado) {
      return alert('Debe seleccionar un empleado.');
    }
    if (this.destinatarioTipo === 'contratista' && !this.rendimiento.idContratista) {
      return alert('Debe seleccionar un contratista.');
    }

    if (this.destinatarioTipo === 'empleado') {
      this.rendimiento.idContratista = 0;
    } else {
      this.rendimiento.idEmpleado = 0;
    }

    this.rendimientoService.crear(this.rendimiento).subscribe({
      next: () => {
        alert('Rendimiento guardado con éxito');
        this.resetFormulario();
      },
      error: () => alert('Error al guardar rendimiento')
    });
  }

  private resetFormulario(): void {
    this.rendimiento = {
      id: 0,
      idEmpleado: 0,
      actividad: '',
      dias: 0,
      unidad: '',
      cantidad: 0,
      observaciones: '',
      idContratista: 0,
      obraId: 0
    };
    this.destinatarioTipo = '';
    this.empleados = [];
    this.contratistas = [];
  }
}
