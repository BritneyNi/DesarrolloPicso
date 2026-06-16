import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ElementoEppInventarioService,InventarioMovimiento } from '../../services/elemento-epp-inventario.service';
import { ElementoEppService } from '../../services/elemento-epp.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { environment } from '../../../environments/environments';
import { toZonedTime } from 'date-fns-tz';

@Component({
  selector: 'app-inventario-elemento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,NavbarComponent,BotonRegresarComponent],
  templateUrl: './inventario-elemento.component.html',
  styleUrls:['./inventario-elemento.component.css']
})
export class InventarioElementoComponent implements OnInit {
  gruposKardex: any[] = [];

  mostrarKardex = false;
  movimientos: InventarioMovimiento[] = [];
  cargandoKardex = false;


  totalCantidad = 0;
  totalDisponible = 0;

  apiBase = environment.apiUrl.replace('/api', '');
  archivoEvidencia: File | null = null;

  elementoId!: number;
  inventarios: any[] = [];
  form!: FormGroup;
  elementoNombre = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private inventarioService: ElementoEppInventarioService,
    private elementoService: ElementoEppService
  ) {}

  ngOnInit(): void {
    this.elementoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();

    this.elementoService.getById(this.elementoId)
  .subscribe(e => this.elementoNombre = e.nombre);

    this.form = this.fb.group({
    talla: ['', Validators.required],
    tipo: [''],
    fechaRecepcion: ['', Validators.required],
    cantidadTotal: [0, [Validators.required, Validators.min(1)]]
  });
  }

  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.archivoEvidencia = input.files[0];
  }
}


cargar() {
  this.inventarioService
    .getByElemento(this.elementoId)
    .subscribe(data => {
      this.inventarios = data;

      this.totalCantidad = data.reduce(
        (sum, i) => sum + i.cantidadTotal,
        0
      );

      this.totalDisponible = data.reduce(
        (sum, i) => sum + i.cantidadDisponible,
        0
      );
    });
}


  guardar() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const formData = new FormData();
  formData.append('ElementoEppId', this.elementoId.toString());
  formData.append('Talla', this.form.value.talla);
  if (this.form.value.tipo) {
  formData.append('Tipo', this.form.value.tipo);
}

  formData.append('FechaRecepcion', this.form.value.fechaRecepcion);
  formData.append('CantidadTotal', this.form.value.cantidadTotal.toString());

  if (this.archivoEvidencia) {
    formData.append('Evidencia', this.archivoEvidencia);
  }

  this.inventarioService.create(formData).subscribe({
    next: () => {
      alert('Elemento agregado');
      this.form.reset();
      this.archivoEvidencia = null;
      this.cargar();
    },
    error: err => {
      alert(err.error || 'Error al agregar inventario');
    }
  });
}


eliminarInventario(id: number) {
  if (!confirm('¿Seguro que deseas eliminar este registro de inventario?')) return;

  this.inventarioService.delete(id).subscribe({
    next: () => {
      alert('Registro eliminado correctamente');
      this.cargar();
    },
    error: err => {
      alert(err.error || 'No se pudo eliminar el registro');
    }
  });
}

toggleKardex() {
  this.mostrarKardex = !this.mostrarKardex;

  if (this.mostrarKardex && this.movimientos.length === 0) {
    this.cargarMovimientos();
  }
}

cargarMovimientos() {
  this.cargandoKardex = true;

  const colombiaTZ = 'America/Bogota';

  this.inventarioService.getMovimientos(this.elementoId).subscribe({
    next: (data: InventarioMovimiento[][] | any) => {
      // Convertimos todas las fechas a hora de Colombia
      data.forEach((grupo: { movimientos: InventarioMovimiento[] }) => {
  grupo.movimientos.forEach((m: InventarioMovimiento) => {
    if (m.fecha) {
      // Aquí forzamos que JS la interprete como UTC y luego la convertimos a Bogotá
      const fechaUTC = new Date(m.fecha + "Z"); // "Z" = UTC
      m.fecha = toZonedTime(fechaUTC, 'America/Bogota');
    }
  });
});

      // data ya viene agrupado desde el backend
      this.gruposKardex = data.map((g: { actaEntregaEppId?: number, movimientos: InventarioMovimiento[] }) => ({
        actaEntregaEppId: g.actaEntregaEppId,
        fecha: g.movimientos[0]?.fecha ?? null,
        tipoMovimiento: g.movimientos[0]?.tipoMovimiento ?? null,
        usuarioEntregaNombre: g.movimientos[0]?.usuarioEntregaNombre ?? null,
        empleadoRecibeNombre: g.movimientos[0]?.empleadoRecibeNombre ?? null,
        items: g.movimientos
      }));

      // Movimientos planos para la tabla del kardex
      this.movimientos = data.flatMap((g: { movimientos: InventarioMovimiento[] }) => g.movimientos);

      this.cargandoKardex = false;
    },
    error: () => {
      alert('Error cargando kardex');
      this.cargandoKardex = false;
    }
  });
}



agruparMovimientos() {
  const map = new Map<number, InventarioMovimiento[]>();

  this.movimientos.forEach(m => {
    const key = m.actaEntregaEppId ?? 0; // Movimientos sin acta se agrupan solos
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(m);
  });

  this.gruposKardex = Array.from(map.entries()).map(([actaId, items]) => ({
    actaEntregaEppId: actaId,
    fecha: items[0].fecha,
    tipoMovimiento: items[0].tipoMovimiento,
    usuarioEntregaNombre: items[0].usuarioEntregaNombre,
    empleadoRecibeNombre: items[0].empleadoRecibeNombre,
    items
  }));
}

}
