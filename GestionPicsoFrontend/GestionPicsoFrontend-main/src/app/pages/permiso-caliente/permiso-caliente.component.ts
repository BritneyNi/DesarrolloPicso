import { Component, OnInit,ElementRef,ViewChildren,QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule,FormArray, FormsModule } from '@angular/forms';
import { PermisoEnCalienteService,PermisoEnCaliente } from '../../services/permiso-caliente.service';
import { CommonModule } from '@angular/common';
import { Empleado,EmpleadoService } from '../../services/empleado-service.service';
import { ActivatedRoute,Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";



@Component({
  selector: 'app-permiso-caliente',
  templateUrl: './permiso-caliente.component.html',
  styleUrls: ['./permiso-caliente.component.css'],
  standalone:true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent]

})
export class PermisoCalienteComponent implements OnInit {
  isDrawing = false;

  textoBusqueda = '';
permisosFiltrados: any[] = [];


  mostrarFormulario = false;

    permisos:PermisoEnCaliente[]=[];
  permiso: any;
  
  form!: FormGroup;
  guardando = false;

  modoEdicion = false;
permisoId?: number;


  empleados: Empleado[] = [];
autorizanteFirmandoIndex: number | null = null;

  elementosProteccion=[
    'Casco con barboquejo','Gafas lente claro','Careta de acrilico',
    'Proteccion auditiva insercion','Guantes hilaza','Careta de soldadura','Proteccion auditiva copa',
    'Guantes carnaza','Basculante de casco','Respirador con cartucho','Guantes vaqueta','Delantal PVC',
    'Respirador material particulado','Guantes caucho','Overol PVC','Gafas de oxicorte','Botas seg dielectricas',
    'Delantal de carnaza','Gafas oscuras','Botas caña alta','Polainas de carnaza'
  ];

  peligros=['Explosion/Incendio','Mordeduras/Picaduras','Choque mecanico o electrico','Ruido o Vibraciones',
    'Caida al mismo o distinto nivel','Locativo','Fugas','Virus/Hongos','Biomecanico','Cargas suspendidas',
    'Iluminacion deficiente','Orden y aseo','Temperatura extrema','Accidente de transito'
  ];

  elementosSeleccionados: string[] = [];
peligrosSeleccionados: string[] = [];

canvasActual!: ElementRef<HTMLCanvasElement>;

  @ViewChildren('canvas') canvases!: QueryList<ElementRef<HTMLCanvasElement>>;
ctx!: CanvasRenderingContext2D;
dibujando = false;

  constructor(
    private fb: FormBuilder,
    private permisoService: PermisoEnCalienteService,
    private empleadoService: EmpleadoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombreEmpresa: [''],
      nit: [''],
      proyecto: [''],
      fechaInicio: [null, Validators.required],
      fechaCierre: [null],
      numeroPermiso: [''],
      herramientas: [''],
      tipoTrabajo: [''],
      descripcionTarea: [''],
      elementosProteccion:[[]],
      peligros:[[]],
      autorizantes:this.fb.array([])
    });
     this.cargarEmpleados();
     this.cargarPermisos();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.modoEdicion = true;
      this.permisoId = id;
      this.mostrarFormulario=true;
      this.cargarPermisoParaEditar(id);
    }
  }

  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


  //mostrarformulario
  toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;
}

cargarPermisoParaEditar(id: number) {
  this.permisoService.obtener(id).subscribe(p => {

    this.form.patchValue({
      nombreEmpresa: p.nombreEmpresa,
      nit: p.nit,
      proyecto: p.proyecto,
      fechaInicio: p.fechaInicio,
      fechaCierre: p.fechaCierre,
      numeroPermiso: p.numeroPermiso,
      herramientas: p.herramientas,
      tipoTrabajo: p.tipoTrabajo,
      descripcionTarea: p.descripcionTarea,
      elementosProteccion: p.elementosProteccion ?? [],
      peligros: p.peligros ?? []
    });

    // 🔥🔥 ESTO ES LO QUE FALTABA
    this.elementosSeleccionados = [...(p.elementosProteccion ?? [])];
    this.peligrosSeleccionados = [...(p.peligros ?? [])];

    // autorizantes igual que antes
    this.autorizantes.clear();

    if (p.autorizantes?.length) {
      p.autorizantes.forEach(a => {
        this.autorizantes.push(
          this.fb.group({
            empleadoId: [a.empleadoId],
            firmaBase64: [a.firmaBase64 || null],
            empleado: [a.empleado || null]
          })
        );
      });
    }
  });
}



guardar(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.guardando = true;

  const payload = {
    ...this.form.value,
    autorizantes: this.autorizantes.value.map((a: any) => ({
      empleadoId: a.empleadoId,
      firmaBase64: a.firmaBase64
    }))
  };

  if (this.modoEdicion && this.permisoId) {
    this.permisoService.actualizar(this.permisoId, payload).subscribe({
      next: () => {
        alert('Permiso en caliente actualizado correctamente');
        this.guardando = false;
        this.router.navigate(['/permiso-caliente-detalle', this.permisoId],{replaceUrl:true});
      },
      error: err => {
        console.error(err);
        alert('Error al actualizar el permiso');
        this.guardando = false;
      }
    });
  } else {
    this.permisoService.crear(payload).subscribe({
      next: id => {
        alert('Permiso en caliente creado correctamente');
        this.guardando = false;
        this.router.navigate(['/permiso-caliente-detalle', id]);
      },
      error: err => {
        console.error(err);
        alert('Error al guardar el permiso');
        this.guardando = false;
      }
    });
  }
}

gestionarPersonal(id?: number) {
  if (!id) return;
  this.router.navigate(['/permiso-caliente', id, 'personal']);
}



cargarEmpleados() {
  this.empleadoService.obtenerEmpleados().subscribe({
    next: (data) => this.empleados = data,
    error: err => console.error('Error cargando empleados', err)
  });
}
//permiso individual
cargarPermiso(id: number) {
  this.permisoService.obtener(id).subscribe(p => {
    this.permiso = p;
  });
}

//todos los permisos
cargarPermisos() {
  this.permisoService.obtenerTodos().subscribe({
    next: data => {
      this.permisos = data;
      // 🔥🔥 CLAVE
      this.permisosFiltrados = [...data];
    },
    error: err => console.error('Error cargando permisos', err)
  });
}



filtrarPermisos() {
  const texto = this.textoBusqueda.toLowerCase().trim();

  if (!texto) {
    this.permisosFiltrados = [...this.permisos];
    return;
  }

  this.permisosFiltrados = this.permisos.filter(permiso => {

    const matchAutorizantes = permiso.autorizantes?.some((a: any) =>
      a.empleado &&
      a.empleado.estado === 'Activo' &&
      a.empleado.nombreCompleto?.toLowerCase().includes(texto)
    );

    const matchPersonal = permiso.personal?.some((p: any) =>
      p.empleado &&
      p.empleado.estado === 'Activo' &&
      p.empleado.nombreCompleto?.toLowerCase().includes(texto)
    );

    return matchAutorizantes || matchPersonal;
  });
}

abrirFirma(index: number) {
  // 🔥 cerrar cualquier canvas previo
  this.autorizanteFirmandoIndex = null;

  setTimeout(() => {
    this.autorizanteFirmandoIndex = index;

    setTimeout(() => {
      const canvasRef = this.canvases.first;
      if (!canvasRef) {
        console.error('Canvas no encontrado para index', index);
        return;
      }

      this.canvasActual = canvasRef;

      const ctx = canvasRef.nativeElement.getContext('2d');
      if (!ctx) return;

      this.ctx = ctx;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = '#000';
    });
  });
}




//Estados de la firma
start(event: MouseEvent | TouchEvent) {
  if (!this.ctx || !this.canvasActual) return;

  event.preventDefault();
  this.isDrawing = true;

  const { x, y } = this.getPosition(event);
  this.ctx.beginPath();
  this.ctx.moveTo(x, y);
}

draw(event: MouseEvent | TouchEvent) {
  if (!this.isDrawing || !this.ctx) return;

  event.preventDefault();
  const { x, y } = this.getPosition(event);
  this.ctx.lineTo(x, y);
  this.ctx.stroke();
}


end() {
  if (!this.ctx) return;
  this.isDrawing = false;
  this.ctx.closePath();
}



//obtener posicion del touch en firma
getPosition(event: MouseEvent | TouchEvent) {
  const rect = this.canvasActual.nativeElement.getBoundingClientRect();

  if (event instanceof TouchEvent) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top
    };
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}


//limpiar firma
limpiar() {
  this.ctx.clearRect(0, 0, 300, 150);
}
//guardar firma
guardarFirma() {
  if (!this.canvasActual || this.autorizanteFirmandoIndex === null) return;

  const firmaBase64 =
    this.canvasActual.nativeElement.toDataURL('image/png');

  const grupo = this.autorizantes.at(this.autorizanteFirmandoIndex);
  grupo.get('firmaBase64')?.setValue(firmaBase64);

  // 🧼 limpieza total
  this.ctx.clearRect(0, 0, 300, 150);
  this.ctx = undefined as any;
  this.canvasActual = undefined as any;
  this.autorizanteFirmandoIndex = null;
}



  onElementoChange(event: any, item: string) {
  const control = this.form.get('elementosProteccion');

  const seleccionados: string[] = Array.isArray(control?.value)
    ? control!.value
    : [];

  if (event.target.checked) {
    control?.setValue([...seleccionados, item]);
  } else {
    control?.setValue(seleccionados.filter(x => x !== item));
  }
}

onPeligroChange(event: any, item: string) {
  const control = this.form.get('peligros');

  const seleccionados: string[] = Array.isArray(control?.value)
    ? control!.value
    : [];

  if (event.target.checked) {
    control?.setValue([...seleccionados, item]);
  } else {
    control?.setValue(seleccionados.filter(x => x !== item));
  }
}

get autorizantes(): FormArray {
  return this.form.get('autorizantes') as FormArray;
}

agregarAutorizante() {
  this.autorizantes.push(
    this.fb.group({
      empleadoId: [null, Validators.required],
      firmaBase64: [null],
      busqueda:[''],
      empleadosFiltrados: [[]]
    })
  );
}


limpiarBusqueda(index: number) {
  const auth = this.autorizantes.at(index);
  auth.patchValue({
    busqueda: '',
    empleadosFiltrados: this.empleados
  });
}

filtrarEmpleados(index: number) {
  const auth = this.autorizantes.at(index);
  const texto = (auth.get('busqueda')?.value || '').toLowerCase();

  if (!texto) {
    auth.patchValue({ empleadosFiltrados: [] });
    return;
  }

  const filtrados = this.empleados.filter(e =>
    e.nombreCompleto.toLowerCase().includes(texto)
  );

  auth.patchValue(
    { empleadosFiltrados: filtrados },
    { emitEvent: false }
  );
}


seleccionarEmpleado(index: number, emp: any) {
  const auth = this.autorizantes.at(index);

  auth.patchValue({
    empleadoId: emp.id,
    empleadoNombre: emp.nombreCompleto,
    busqueda: emp.nombreCompleto,
    empleadosFiltrados: []
  });
}




eliminarAutorizante(index: number) {
  this.autorizantes.removeAt(index);
}

eliminarPermiso(id?: number) {
  if (!id) return;

  const confirmar = confirm('¿Seguro que deseas eliminar este permiso?');
  if (!confirmar) return;

  this.permisoService.eliminar(id).subscribe({
    next: () => {
      alert('Permiso eliminado correctamente');
      this.cargarPermisos(); // 🔥 refresca la tabla
    },
    error: err => {
      console.error(err);
      alert('Error al eliminar el permiso');
    }
  });
}
//ver detalles del permiso
verDetalle(id?:number){
    if(!id) return;
    this.router.navigate(['/permiso-caliente-detalle',id]);
}

}
