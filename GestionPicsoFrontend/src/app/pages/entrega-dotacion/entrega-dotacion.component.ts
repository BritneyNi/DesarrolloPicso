import { Component, OnInit,ElementRef,ViewChild,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators,FormControl } from '@angular/forms';
import { EntregaEppService,ResponsableEnvioDto,ResponsableEntregaDto } from '../../services/entrega-epp.service';
import {EmpleadoService,Empleado } from '../../services/empleado-service.service';
import { ElementoEppService, ElementoEpp } from '../../services/elemento-epp.service';
import { Router } from '@angular/router';
import { ElementoEppInventarioService,ElementoEppInventario } from '../../services/elemento-epp-inventario.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs'; // ✅ CORRECCIÓN: import forkJoin

interface ElementoSeleccionado {
  inventarioId: number;
  cantidad: number;
  elementoNombre: string;
  talla: string;
}

@Component({
  standalone: true,
  selector: 'app-entrega-dotacion',
  imports: [CommonModule, ReactiveFormsModule,NavbarComponent,BotonRegresarComponent],
  templateUrl: './entrega-dotacion.component.html',
  styleUrls: ['./entrega-dotacion.component.css']
})

export class EntregaDotacionComponent implements OnInit {
responsablesEntrega: ResponsableEntregaDto[] = [];
responsablesEntregaFiltrados: ResponsableEntregaDto[] = [];
responsableEntregaSeleccionado?: ResponsableEntregaDto;

responsablesEnvio: ResponsableEnvioDto[] = [];
responsablesEnvioFiltrados: ResponsableEnvioDto[] = [];
responsableEnvioSeleccionado?: ResponsableEnvioDto;

mostrarResumen = false;

// ================== FIRMAS ==================
@ViewChild('firmaEmpleado') firmaEmpleadoCanvas!: ElementRef<HTMLCanvasElement>;
@ViewChild('firmaResponsable') firmaResponsableCanvas!: ElementRef<HTMLCanvasElement>;

private dibujando = false;
private ctx?: CanvasRenderingContext2D;
private canvasActivo?: HTMLCanvasElement;

firmaEmpleadoBase64: string | null = null;
firmaResponsableBase64: string | null = null;

empleados: Empleado[] = [];
empleadosFiltrados: Empleado[] = [];
empleadoSeleccionado?: Empleado;
elementosSeleccionados: ElementoSeleccionado[] = [];
elementos: ElementoEpp[] = [];

inventarios: ElementoEppInventario[] = [];

mostrarListaEnvio = false;
mostrarListaEntrega = false;
esMovil = false;
form!: FormGroup;
formResponsable!: FormControl;
private empleadoPendienteId?: number;

  constructor(
    private fb: FormBuilder,
    private entregaService: EntregaEppService,
    private empleadoService: EmpleadoService,
    private eppService: ElementoEppService,
    private inventarioService: ElementoEppInventarioService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


ngOnInit(): void {
  this.esMovil = window.innerWidth <= 768;

  window.addEventListener('resize', () => {
    this.esMovil = window.innerWidth <= 768;
  });

  this.form = this.fb.group({
    empleadoId: [null, Validators.required],
    elementoId: [null, Validators.required],
    responsableEnvio: [''],
    lugarEntrega: ['', Validators.required],
    observaciones: ['']
  });

  this.formResponsable = new FormControl(null, Validators.required);

  this.entregaService.getResponsablesEnvio().subscribe(data => {
    this.responsablesEnvio = data;
  });

  this.entregaService.getResponsablesEntrega().subscribe(data => {
    this.responsablesEntrega = data;
  });

  this.empleadoService.obtenerEmpleados().subscribe(data => {
    this.empleados = data;

    if (this.empleadoPendienteId) {
      const emp = this.empleados.find(e => e.id === this.empleadoPendienteId);
      if (emp) {
        this.seleccionarEmpleado(emp);
      }
      this.empleadoPendienteId = undefined;
    }
  });

  this.cargarElementos();

  this.route.queryParams.subscribe(p => {
    if (p['empleado']) {
      this.empleadoPendienteId = Number(p['empleado']);
    }
  });
}

@HostListener('document:click', ['$event'])
clickFuera(event: MouseEvent) {
  const target = event.target as HTMLElement;

  if (!target.closest('.autocomplete-envio')) {
    this.mostrarListaEnvio = false;
  }

  if (!target.closest('.autocomplete-entrega')) {
    this.mostrarListaEntrega = false;
  }
}

filtrarResponsablesEntrega(event: Event) {
  const value = (event.target as HTMLInputElement).value.toLowerCase();

  if (!value) {
    this.responsablesEntregaFiltrados = [];
    return;
  }

  this.responsablesEntregaFiltrados = this.responsablesEntrega.filter(r =>
    r.nombreCompleto.toLowerCase().includes(value)
  );
  this.mostrarListaEntrega = true;
}

onFocusResponsableEnvio() {
  this.mostrarListaEnvio = true;
  this.responsablesEnvioFiltrados = [...this.responsablesEnvio];
}

onFocusResponsableEntrega() {
  this.mostrarListaEntrega = true;
  this.responsablesEntregaFiltrados = [...this.responsablesEntrega];
}

seleccionarResponsableEntrega(r: ResponsableEntregaDto) {
  this.responsableEntregaSeleccionado = r;
  this.formResponsable.setValue(r.id);
  this.mostrarListaEntrega = false;
  this.responsablesEntregaFiltrados = [];
}

filtrarResponsablesEnvio(event: Event) {
  const value = (event.target as HTMLInputElement).value.toLowerCase();

  if (!value) {
    this.responsablesEnvioFiltrados = [];
    return;
  }

  this.responsablesEnvioFiltrados = this.responsablesEnvio.filter(r =>
    r.nombreCompleto.toLowerCase().includes(value)
  );
}

seleccionarResponsableEnvio(r: ResponsableEnvioDto) {
  this.responsableEnvioSeleccionado = r;
  this.form.patchValue({ responsableEnvio: r.nombreCompleto });
  this.mostrarListaEnvio = false;
  this.responsablesEnvioFiltrados = [];
}

iniciarFirmaPointer(event: PointerEvent, tipo: 'empleado' | 'responsable') {
  event.preventDefault();

  this.dibujando = true;

  this.canvasActivo =
    tipo === 'empleado'
      ? this.firmaEmpleadoCanvas.nativeElement
      : this.firmaResponsableCanvas.nativeElement;

  this.ctx = this.canvasActivo.getContext('2d')!;
  this.ctx.beginPath();

  const rect = this.canvasActivo.getBoundingClientRect();
  this.ctx.moveTo(
    event.clientX - rect.left,
    event.clientY - rect.top
  );

  this.ctx.lineWidth = 2;
  this.ctx.lineCap = 'round';
}

dibujarFirmaPointer(event: PointerEvent) {
  if (!this.dibujando || !this.ctx || !this.canvasActivo) return;

  const rect = this.canvasActivo.getBoundingClientRect();
  this.ctx.lineTo(
    event.clientX - rect.left,
    event.clientY - rect.top
  );
  this.ctx.stroke();
}

finalizarFirma() {
  if (!this.dibujando || !this.canvasActivo) return;
  this.dibujando = false;

  const base64 = this.canvasActivo.toDataURL('image/png');

  if (this.canvasActivo === this.firmaEmpleadoCanvas.nativeElement) {
    this.firmaEmpleadoBase64 = base64;
  } else {
    this.firmaResponsableBase64 = base64;
  }
}

limpiarFirma(tipo: 'empleado' | 'responsable') {
  const canvas =
    tipo === 'empleado'
      ? this.firmaEmpleadoCanvas.nativeElement
      : this.firmaResponsableCanvas.nativeElement;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (tipo === 'empleado') this.firmaEmpleadoBase64 = null;
  else this.firmaResponsableBase64 = null;
}

confirmarEntregaFinal() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  if (!this.firmaEmpleadoBase64 || !this.firmaResponsableBase64) {
    alert('Faltan las firmas');
    return;
  }

  if (!this.empleadoSeleccionado) return;

  if (!this.formResponsable.value) {
    alert('Seleccione un responsable');
    return;
  }

  const dto = {
    empleadoId: this.empleadoSeleccionado.id,
    observaciones: this.form.value.observaciones,
    responsableEnvio: this.form.value.responsableEnvio,
    lugarEntrega: this.form.value.lugarEntrega,
    responsableId: this.formResponsable.value,
    items: this.elementosSeleccionados.map(e => ({
      elementoEppInventarioId: e.inventarioId,
      cantidad: e.cantidad
    }))
  };

  this.entregaService.confirmarEntrega(dto).subscribe({
    next: (res: any) => {
      const actaId = res.actaId;

      // ✅ CORRECCIÓN: esperar ambas firmas antes de continuar
      forkJoin([
        this.entregaService.firmarActa({
          actaId,
          tipo: 'empleado',
          firmaEmpleadoBase64: this.firmaEmpleadoBase64!
        }),
        this.entregaService.firmarActa({
          actaId,
          tipo: 'responsable',
          firmaResponsableBase64: this.firmaResponsableBase64!
        })
      ]).subscribe({
        next: () => {
          alert('Entrega confirmada correctamente');
          this.resetearFormulario();
        },
        error: err => {
          alert('Entrega creada pero error al guardar las firmas. Intente de nuevo.');
          console.error(err);
        }
      });
    },
    error: err => alert(err.error)
  });
}

firmarActa(
  actaId: number,
  tipo: 'empleado' | 'responsable',
  firmaBase64: string
) {
  const payload: any = {
    actaId,
    tipo
  };

  if (tipo === 'empleado') {
    payload.firmaEmpleadoBase64 = firmaBase64;
  } else {
    payload.firmaResponsableBase64 = firmaBase64;
  }

  return this.entregaService.firmarActa(payload);
}

resetearFormulario() {
  this.elementosSeleccionados = [];
  this.mostrarResumen = false;
  this.form.reset();
  this.formResponsable.reset();
  this.inventarios = [];
  this.empleadoSeleccionado = undefined;

  this.firmaEmpleadoBase64 = null;
  this.firmaResponsableBase64 = null;

  if (this.firmaEmpleadoCanvas) {
    const ctx1 = this.firmaEmpleadoCanvas.nativeElement.getContext('2d')!;
    ctx1.clearRect(0, 0, 500, 200);
  }

  if (this.firmaResponsableCanvas) {
    const ctx2 = this.firmaResponsableCanvas.nativeElement.getContext('2d')!;
    ctx2.clearRect(0, 0, 500, 200);
  }
}

cargarElementos() {
  this.eppService.getActivos().subscribe(data => {
    this.elementos = data;
  });
}

continuarEntrega() {
  if (this.elementosSeleccionados.length === 0) return;
  this.mostrarResumen = true;
}

getInventario(id: number): ElementoEppInventario | undefined {
  return this.inventarios.find(i => i.id === id);
}

onElementoChange(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value);
  this.form.patchValue({ elementoId: id });
  this.cargarInventarioPorElemento(String(id));
}

toggleElemento(id: number, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;

  if (checked) {
    if (!this.elementosSeleccionados.some(e => e.inventarioId === id)) {
      const inv = this.inventarios.find(i => i.id === id);
      if (!inv) return;

      const elementoId = this.form.value.elementoId;
      const elemento = this.elementos.find(e => e.id === elementoId);
      this.elementosSeleccionados.push({
        inventarioId: id,
        cantidad: 1,
        elementoNombre: elemento?.nombre ?? '—',
        talla: inv.talla
      });
    }
  } else {
    this.elementosSeleccionados =
      this.elementosSeleccionados.filter(e => e.inventarioId !== id);
  }
}

getCantidad(id: number): number {
  return this.elementosSeleccionados.find(e => e.inventarioId === id)?.cantidad || 1;
}

setCantidad(id: number, cantidad: number | string) {
  const item = this.elementosSeleccionados.find(e => e.inventarioId === id);
  if (!item) return;

  const value = Number(cantidad);
  const max = this.getInventario(id)?.cantidadDisponible || 1;

  item.cantidad = Math.min(Math.max(1, value), max);
}

get totalCantidad(): number {
  return this.elementosSeleccionados.reduce(
    (total, item) => total + item.cantidad,
    0
  );
}

entregarMultiple() {
  const empleadoId = this.form.value.empleadoId;

  if (!empleadoId || this.elementosSeleccionados.length === 0) {
    alert('Seleccione empleado y al menos un elemento');
    return;
  }

  this.entregaService.createMultiple({
    empleadoId: Number(empleadoId),
    items: this.elementosSeleccionados,
    observaciones: this.form.value.observaciones
  }).subscribe({
    next: () => {
      alert('Dotación entregada correctamente');
      this.elementosSeleccionados = [];
      this.mostrarResumen = false;
      this.form.patchValue({ elementoId: null, observaciones: '' });
      this.inventarios = [];
    },
    error: err => {
      alert(err.error);
    }
  });
}

cargarInventarioPorElemento(elementoId: string) {
  const id = Number(elementoId);
  if (!id) {
    this.inventarios = [];
    return;
  }

  this.inventarioService
    .getByElemento(id)
    .subscribe(data => {
      this.inventarios = data.filter(i => i.cantidadDisponible > 0);
    });
}

verHistorial() {
  this.router.navigate(['/historial-entregas']);
}

filtrarEmpleados(texto: string) {
  if (!texto) {
    this.empleadosFiltrados = [];
    return;
  }

  const value = texto.toLowerCase();

  this.empleadosFiltrados = this.empleados.filter(e =>
    e.estado === 'Activo' &&
    e.nombreCompleto.toLowerCase().includes(value)
  );
}

filtrarEmpleadosInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  this.filtrarEmpleados(value);
}

seleccionarEmpleado(emp: Empleado) {
  this.empleadoSeleccionado = emp;
  this.form.patchValue({ empleadoId: emp.id });
  this.empleadosFiltrados = [];
}

estaSeleccionado(inventarioId: number): boolean {
  return this.elementosSeleccionados.some(
    e => e.inventarioId === inventarioId
  );
}

}