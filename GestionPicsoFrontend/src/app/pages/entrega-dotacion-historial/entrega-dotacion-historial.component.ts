import { Component, OnInit,ElementRef,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntregaEppService } from '../../services/entrega-epp.service';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UniqueByPipe } from '../../pipes/unique-by.pipe';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

interface HistorialElemento {
  id: number;
  nombre: string;
  talla: string;
  cantidad: number;
  estado: string;
  observaciones?: string;
  evidencias: string[];
  fechaEntrega: string;
}

interface HistorialActa {
  actaId: number;
  empleadoId: number;
  empleadoNombre: string;
  responsableNombre: string;
  fechaEntrega: string;
  observaciones: string;
  quienRecibe: string;
  lugarEntrega: string;
  firmaEmpleadoUrl: string;
  firmaResponsableUrl: string;
  elementos: HistorialElemento[];

}

@Component({
  selector: 'app-entrega-dotacion-historial',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,UniqueByPipe,NavbarComponent,BotonRegresarComponent],
  templateUrl: './entrega-dotacion-historial.component.html',
  styleUrls: ['./entrega-dotacion-historial.component.css']
})
export class EntregaDotacionHistorialComponent implements OnInit {
  empleadosUnicos: { id: number; nombre: string }[] = [];
  empleadosFiltrados: { id: number; nombre: string }[] = [];
  mostrarDropdown = false;

  empleadoSeleccionadoId?: number;

  entregas: HistorialActa[] = [];
  entregasFiltradas: HistorialActa[] = [];

  formResponsable!: FormControl;

  empleadoActual?: string; // Nombre o id del empleado seleccionado
  
  filtroEmpleado = new FormControl('');
  filtroFechaInicio = new FormControl('');
  filtroFechaFin = new FormControl('');

  constructor(
    private entregaService: EntregaEppService,
    private elementRef: ElementRef
    ) {}

  @HostListener('document:click', ['$event'])
onClickFuera(event: MouseEvent) {
  if (!this.elementRef.nativeElement.contains(event.target)) {
    this.mostrarDropdown = false;
  }
}
@HostListener('document:keydown.escape')
onEscape() {
  this.mostrarDropdown = false;
}


  ngOnInit(): void {
  this.cargarEntregas();

  // 🔹 AUTOCOMPLETE + FILTRO
  this.filtroEmpleado.valueChanges.subscribe(value => {
    const texto = value?.toLowerCase().trim() || '';

    // 🔹 si borran el texto → cerrar y resetear
    if (!texto) {
      this.empleadosFiltrados = [];
      this.mostrarDropdown = false;
      this.empleadoSeleccionadoId = undefined;
      this.aplicarFiltros();
      return;
    }

    this.empleadosFiltrados = this.empleadosUnicos.filter(e =>
      e.nombre.toLowerCase().includes(texto)
    );

    this.mostrarDropdown = true;
    this.empleadoSeleccionadoId = undefined;
  });

  // 🔹 SOLO fechas disparan filtros directos
  this.filtroFechaInicio.valueChanges.subscribe(() => this.aplicarFiltros());
  this.filtroFechaFin.valueChanges.subscribe(() => this.aplicarFiltros());

}


resaltarNombre(nombre: string): string {
  const texto = this.filtroEmpleado.value;
  if (!texto) return nombre;

  const regex = new RegExp(`(${texto})`, 'ig');
  return nombre.replace(regex, '<strong>$1</strong>');
}


toggleHistorial(actaId: number) {
  this.empleadoActual =
    this.empleadoActual === actaId.toString()
      ? undefined
      : actaId.toString();
}

descargarPdf(actaId: number) {
  this.entregaService.descargarPdf(actaId);
}


descargarPdfEmpleado() {
  if (!this.empleadoSeleccionadoId) return;

  const desde = this.filtroFechaInicio.value
    ? new Date(this.filtroFechaInicio.value).toISOString()
    : '';
  const hasta = this.filtroFechaFin.value
    ? new Date(this.filtroFechaFin.value).toISOString()
    : '';

  // 👇 Pasamos el ID real del empleado, no el acta
  this.entregaService.descargarPdfEmpleado(
    this.empleadoSeleccionadoId,
    desde,
    hasta
  );
}



onEmpleadoSeleccionado(nombre: string, id: number) {
  this.filtroEmpleado.setValue(nombre);
  this.empleadoSeleccionadoId = id;
}


cargarEntregas() {
  this.entregaService.getHistorial().subscribe(data => {
    this.entregas = data;

    const map = new Map<number, string>();
    data.forEach(e => {
      if (!map.has(e.empleadoId)) {
        map.set(e.empleadoId, e.empleadoNombre);
      }
    });

    this.empleadosUnicos = Array.from(map.entries()).map(
      ([id, nombre]) => ({ id, nombre })
    );

    this.aplicarFiltros();

  });
}


aplicarFiltros() {
  const fechaInicio = this.filtroFechaInicio.value
    ? new Date(this.filtroFechaInicio.value)
    : null;

  const fechaFin = this.filtroFechaFin.value
    ? new Date(this.filtroFechaFin.value)
    : null;

  if (fechaFin) {
    fechaFin.setHours(23, 59, 59, 999);
  }

  this.entregasFiltradas = this.entregas.filter(e => {
    // 🔹 FILTRO POR EMPLEADO (ID REAL)
    const cumpleEmpleado =
      !this.empleadoSeleccionadoId ||
      e.empleadoId === this.empleadoSeleccionadoId;

    const fechaEntrega = new Date(e.fechaEntrega);

    const cumpleInicio =
      !fechaInicio || fechaEntrega >= fechaInicio;

    const cumpleFin =
      !fechaFin || fechaEntrega <= fechaFin;

    return cumpleEmpleado && cumpleInicio && cumpleFin;
  });
}


seleccionarEmpleado(emp: { id: number; nombre: string }) {
  this.filtroEmpleado.setValue(emp.nombre, { emitEvent: false });
  this.empleadoSeleccionadoId = emp.id;
  this.mostrarDropdown = false;

  // aplicar filtros reales
  this.aplicarFiltros();
}




  devolver(id: number) {
  if (!confirm('¿Confirmar devolución?')) return;

  this.entregaService.devolver(id).subscribe(() => {
    this.cargarEntregas();
    
  });
}

marcarPerdido(id: number) {
  if (!confirm('¿Marcar como perdido?')) return;

  this.entregaService.perdido(id).subscribe(() => {
    this.cargarEntregas();
  });
}
subirEvidencia(entregaId: number, event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = (reader.result as string).split(',')[1];

    const payload = {
      entregaEppId: entregaId,
      nombreArchivo: file.name,
      archivoBase64: base64
    };

    this.entregaService.subirEvidencia(payload).subscribe({
      next: () => {
        alert('Evidencia subida correctamente');
        this.cargarEntregas(); // 🔄 refresca historial
      },
      error: () => {
        alert('Error al subir evidencia');
      }
    });
  };

  reader.readAsDataURL(file);
}



}
