import { Component, OnInit,ViewChildren,QueryList,ElementRef,ViewChild } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { Router,ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule,FormsModule, Validators } from '@angular/forms';
import { PermisoAlturasService } from '../../services/permiso-alturas.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import jsPDF from 'jspdf';
import { PermisoAlturasPdfService } from '../../services/permiso-alturas-pdf.service';


@Component({
  selector: 'app-permiso-alturas',
  templateUrl: './permiso-alturas.component.html',
  styleUrls:['./permiso-alturas.component.css'],
  imports: [ReactiveFormsModule,CommonModule,BotonRegresarComponent,NavbarComponent,FormsModule]
})
export class PermisoAlturasComponent implements OnInit, AfterViewInit {

  form: FormGroup;
 
  medidasSeleccionadas: string[] = [];
  proteccionSeleccionada: string[] = [];
  mostrarFormulario = false;
  permisos: any[] = [];

  firmandoResponsable = false;
  firmaResponsableBase64: string | null = null;

  permisoActivo: any = null;

  filtroEmpleado: string = '';
  permisosOriginales: any[] = [];

  empleadosFiltrados: any[] = [];
  campoActivo: string | null = null;

empleadoVisual: {
  [campo: string]: string;
} = {};

modoEdicion = false;
permisoId!: number;

empleadoSeleccionado: any = {};
  itemsComprobacion = [
  'Los trabajadores cuentan con la certificacion de capacitacion y/o competencia laboral para el trabajo seguro en alturas',
  'Los trabajadores tienen el concepto de aptitud avalado por el medico en los examenes ocupacionales',
  'Los trabajadores cuentan con afiliación vigente en seguridad social integral',
  'Actualmente toma medicamentos que causen sueño, ejemplo antigripales',
  'Se encuentra en condiciones optimas de salud física y mental para realizar el trabajo',
  'Sufre epilepsia(ha sufrido),mareos,desmayos o vértigo',
  'Miedo a las alturas (acrofobia)',
  'Actualmente tiene alguna restricción médica',
  'Ha consumido algún tipo de licor y/o sustancia psicoactiva en las últimas 24 horas',
  'Existe análisis de riesgos (ATS / ARO)',
  'Se dispone de elementos de protección personal de acuerdo a los riesgos',
  'Los trabajadores tienen la formación e información específica sobre la tarea a realizar, los riesgos y medidas preventivas',
  'Hay claridad en las herramientras a utilizar',
  'Medidas de prevención contra caídas claras',
  'Ayudante de seguridad asignado',
  'Distancia segura a líneas eléctricas',
  'Área aislada y señalizada',
  'Supervisión directa (coordinador de alturas)',
  'Sistemas de acceso en buen estado',
  'Barandas del andamio correctas',
  'Andamios completos',
  'Frenos de andamio funcionando',
  'Terreno firme y nivelado',
  'Escaleras cumplen normas técnicas',
  'Escalera asegurada a estructura',
  'Superficie firme para escalera',
  'Zapatas antideslizantes',
  'Rutas de evacuación identificadas',
  'Controles para sustancias químicas',
  'Permisos adicionales verificados',
  'Zona aislada con cinta o mamparas',
  'Línea de vida instalada',
  'Freno de seguridad certificado',
  'Sistemas de restricción o detención',
  'Barandas en zonas de vacío'
];
  @ViewChildren('canvas') canvasList!: QueryList<ElementRef<HTMLCanvasElement>>;
 @ViewChild('canvasFirmaResponsable', { static: false })
  canvasFirmaResponsable!: ElementRef<HTMLCanvasElement>;

  ctxFirma!: CanvasRenderingContext2D;

  ctxEvaluacionMap = new Map<any, CanvasRenderingContext2D>();
  firmandoEvaluacionMap = new Map<any, boolean>();

  

  constructor(
    private fb: FormBuilder,
    private permisoService: PermisoAlturasService,
    private router: Router,
    private route: ActivatedRoute,
    private pdfService: PermisoAlturasPdfService
  ) {
    this.form = this.fb.group({
      // Campos existentes
      fecha: [''],
      lugarEjecucion: [''],
      herramientaUtilizar: [''],
      tipoTrabajoRealizar: [''],

      // Campos nuevos del JSON
      fechaInicio: [''],
      fechaFinalizacion: [''],
      alturaAproximada: [''],
     responsablePermisoEmpleadoId: [null],
      descripcionTarea: [''],

      // Medidas Prevencion
      medidaPrevencionProteccion: [''],
      otroAcceso: [''],

      // Elementos de Proteccion
      proteccionPersonal: [''],
      otrosElementos: [''],

      // Secciones repetitivas
      personalAutorizado: this.fb.array([]),
      responsablesPlanEmergencia: this.fb.array([]),

      ayudanteSeguridadEmpleadoId: [null],
      personaAutorizaEmpleadoId: [null],
      coordinadorTrabajoAlturasEmpleadoId: [null],

      permisoTrabajoElectrico: [false],
      observaciones: ['']

      
    });
  } 

  ngAfterViewInit() {
  if (this.mostrarFormulario) {
    setTimeout(() => this.inicializarFirmaResponsable(), 0);
  }
}


  ngOnInit() {
    // 🔹 1. Detectar si viene ID (edición)
  this.route.paramMap.subscribe(params => {
   
    const id = params.get('id');
    if (id) {
      this.modoEdicion = true;
      this.permisoId = +id;

      this.mostrarFormulario=true;
      this.cargarPermisoParaEditar(this.permisoId);
    }
  });

    this.cargarPermisos();
    // Inicializar con una fila por defecto
    if (this.responsablesPlanEmergencia.length === 0) {
      this.agregarResponsablePlanEmergencia();
    }
  }
  //
  
  cargarPermisoParaEditar(id: number) {
  this.permisoService.obtener(id.toString()).subscribe(permiso => {
  
    this.form.patchValue({
      fecha: permiso.fecha,
      fechaInicio: permiso.fechaInicio,
      fechaFinalizacion: permiso.fechaFinalizacion,
      lugarEjecucion: permiso.lugarEjecucion,
      tipoTrabajoRealizar: permiso.tipoTrabajoRealizar,
      alturaAproximada: permiso.alturaAproximada,
      descripcionTarea: permiso.descripcionTarea,
      herramientaUtilizar: permiso.herramientaUtilizar,
      permisoTrabajoElectrico: permiso.trabajoElectrico,
      observaciones: permiso.observaciones,
      otroAcceso: permiso.otroAcceso,
      otrosElementos: permiso.otrosElementos,
      responsablePermisoEmpleadoId:permiso.responsablePermisoEmpleado?.id ?? null,
      ayudanteSeguridadEmpleadoId: permiso.ayudanteSeguridadEmpleado?.id ?? null,
      personaAutorizaEmpleadoId: permiso.personaAutorizaEmpleado?.id ?? null,
      coordinadorTrabajoAlturasEmpleadoId:permiso.coordinadorTrabajoAlturasEmpleado?.id ?? null
    });

    // ✅ CHECKBOXES
    this.medidasSeleccionadas = permiso.medidaPrevencionProteccion
      ? JSON.parse(permiso.medidaPrevencionProteccion)
      : [];

    this.form.get('medidaPrevencionProteccion')
      ?.setValue(JSON.stringify(this.medidasSeleccionadas));

      // ✅ CHECKBOXES PROTECCIÓN PERSONAL
    this.proteccionSeleccionada = permiso.proteccionPersonal
      ? JSON.parse(permiso.proteccionPersonal)
      : [];

    this.form.get('proteccionPersonal')
      ?.setValue(JSON.stringify(this.proteccionSeleccionada));

    // ✅ AUTOCOMPLETE VISUAL
    this.empleadoVisual['responsablePermiso'] =
      permiso.responsablePermisoEmpleado?.nombreCompleto || '';
    this.empleadoVisual['ayudanteSeguridad'] =
      permiso.ayudanteSeguridadEmpleado?.nombreCompleto || '';
    this.empleadoVisual['personaAutoriza'] =
      permiso.personaAutorizaEmpleado?.nombreCompleto || '';
    this.empleadoVisual['coordinadorTrabajoAlturas'] =
      permiso.coordinadorTrabajoAlturasEmpleado?.nombreCompleto || '';

    // ✅ AUTOCOMPLETE REAL (ID)
    this.empleadoSeleccionado.responsablePermiso =
      permiso.responsablePermisoEmpleado;
    this.empleadoSeleccionado.ayudanteSeguridad =
      permiso.ayudanteSeguridadEmpleado;
    this.empleadoSeleccionado.personaAutoriza =
      permiso.personaAutorizaEmpleado;
    this.empleadoSeleccionado.coordinadorTrabajoAlturas =
      permiso.coordinadorTrabajoAlturasEmpleado;

    // ✅ RESPONSABLES PLAN EMERGENCIA
    this.responsablesPlanEmergencia.clear();

    permiso.responsablesPlanEmergencia?.forEach((r: any) => {
      this.responsablesPlanEmergencia.push(
        this.fb.group({
          id: [r.id],
          nombres: [r.empleado?.nombreCompleto || r.nombres || ''],
          empleadoId: [r.empleado?.id || null]
        })
      );
    });
  });
}

 buscarEmpleados(texto: string, campo: string) {
  this.campoActivo = campo;

  if (!texto || texto.length < 2) {
    this.empleadosFiltrados = [];
    return;
  }

  this.permisoService.buscar(texto).subscribe(res => {
    this.empleadosFiltrados = res;
  });
}


seleccionarEmpleado(e: any) {
  if (!this.campoActivo) return;

  // 🔐 guardar ID real
  this.form.get(this.campoActivo + 'EmpleadoId')
    ?.setValue(e.id);

  // 👁️ solo visual
  this.empleadoVisual[this.campoActivo] = e.nombreCompleto;

  this.empleadosFiltrados = [];
  this.campoActivo = null;
}



seleccionarEmpleadoArray(e: any, index: number) {
  const grupo = this.responsablesPlanEmergencia.at(index);

  grupo.get('empleadoId')?.setValue(e.id);
  grupo.get('nombres')?.setValue(e.nombreCompleto);

  this.empleadosFiltrados = [];
}



seleccionarEmpleadoPersonal(e: any, permiso: any) {
  permiso.formPersona.patchValue({
    nombres: e.nombreCompleto,
    empleadoId: e.id
  });

  this.empleadosFiltrados = [];
}




 filtrarPermisos() {
  const texto = this.filtroEmpleado.toLowerCase().trim();

  if (!texto) {
    this.permisos = [...this.permisosOriginales];
    return;
  }

  this.permisos = this.permisosOriginales.filter(permiso =>
    permiso.personalAutorizado?.some((p: any) =>
      p.nombres?.toLowerCase().includes(texto)
    )
  );
}

  // FormArrays
  get personalAutorizado(): FormArray {
    return this.form.get('personalAutorizado') as FormArray;
  }

  get responsablesPlanEmergencia(): FormArray {
    return this.form.get('responsablesPlanEmergencia') as FormArray;
  }

  crearFormularioComprobacion() {
  const grupo: any = {};
  this.itemsComprobacion.forEach((item, index) => {
    // Cada item tiene un subgrupo para los días
    grupo[`item${index + 1}`] = this.fb.group({
      lunes: [false],
      martes: [false],
      miercoles: [false],
      jueves: [false],
      viernes: [false],
      sabado: [false],
      domingo: [false],
     

      // resultado
      si: [false],
      no: [false],
      noAplica: [false]
    });
  });

  return this.fb.group(grupo);
}

seleccionarResultado(p: any, index: number, seleccionado: 'si' | 'no' | 'noAplica') {
  const grupo = p.formComprobacion.get('item' + (index + 1));

  if (!grupo) return;

  ['si', 'no', 'noAplica'].forEach(op => {
    if (op !== seleccionado) {
      grupo.get(op)?.setValue(false, { emitEvent: false });
    }
  });
}

cargarPermisos() {
  this.permisoService.obtenerTodos().subscribe({
    next: (data: any[]) => {
      this.permisosOriginales = data.map(p => ({
        ...p,
        mostrarPersonal: false,
        mostrarFormularioPersona: false
      }));

      // Copia para mostrar
      this.permisos = [...this.permisosOriginales];
    },
    error: () => alert('Error al cargar permisos')
  });
}


//eliminar permiso

eliminarPermiso(permiso: any) {
  if (!confirm('⚠️ ¿Seguro que deseas eliminar este permiso COMPLETO?\nSe eliminará todo el personal y evaluaciones.'))
    return;

  this.permisoService.eliminarPermiso(permiso.id)
    .subscribe({
      next: () => {
        // 🔥 eliminar del listado sin recargar
        this.permisos = this.permisos.filter(p => p.id !== permiso.id);
      },
      error: () => {
        alert('Error eliminando el permiso');
      }
    });
}


obtenerResultadoItem(item: any): 'SI' | 'NO' | 'NA' {
  if (!item) return 'NA';
  if (item.si) return 'SI';
  if (item.no) return 'NO';
  return 'NA';
}

obtenerDiaItem(item: any): string {
  if (!item || !item.si) return '';

  if (item.lunes) return 'Lunes';
  if (item.martes) return 'Martes';
  if (item.miercoles) return 'Miércoles';
  if (item.jueves) return 'Jueves';
  if (item.viernes) return 'Viernes';
  if (item.sabado) return 'Sábado';
  if (item.domingo) return 'Domingo';

  return '';
}

//metodos para crear evaluacion de permiso alturas

nuevaComprobacion(p: any) {
  if (p.mostrandoComprobacion) {
    p.mostrandoComprobacion = false;
    p.formComprobacion = null;
    return;
  }

  p.itemsComprobacion = [...this.itemsComprobacion];
  p.formComprobacion = this.crearFormularioComprobacion();
  p.mostrandoComprobacion = true;
}


//guardar evaluación
guardarComprobacion(persona: any) {
  if (!persona.formComprobacion) return;

  if (!persona.firmaEmpleadoBase64) {
  alert('Debe firmar la evaluación antes de guardar');
  return;
}

const payload = {
  evaluacionJson: JSON.stringify(persona.formComprobacion.value),
  firmaEmpleadoBase64: persona.firmaEmpleadoBase64
};


  this.permisoService.crearComprobacion(persona.id, payload)
    .subscribe({
      next: (res) => {

        persona.comprobacionesPrevias ??= [];
        persona.comprobacionesPrevias.unshift(res);

        persona.mostrandoComprobacion = false;
        persona.formComprobacion = null;
        persona.firmaEvaluacionBase64 = null;

        alert('Evaluación guardada correctamente');
      },
      error: (err) => {
        console.error(err);
        alert('Error guardando evaluación');
      }
    });
}


//VER EVALUACIONES
verEvaluaciones(permiso: any,persona: any) {
  this.permisoActivo = permiso;
  persona.mostrandoEvaluaciones = !persona.mostrandoEvaluaciones;

  if (!persona.mostrandoEvaluaciones) return;

  persona.cargandoEvaluaciones = true;

  this.permisoService.obtenerComprobaciones(persona.id)
    .subscribe({
      next: (res) => {
        persona.comprobacionesPrevias = res.map(ev => ({
          ...ev,
          evaluacion: JSON.parse(ev.evaluacionJson) // 🔥 CLAVE
        }));

        persona.cargandoEvaluaciones = false;
      },
      error: () => {
        alert('Error cargando evaluaciones');
        persona.cargandoEvaluaciones = false;
      }
    });
}

//eliminar evaluacion

eliminarEvaluacion(persona: any, evaluacion: any) {
  if (!confirm('¿Seguro que deseas eliminar esta evaluación?')) return;

  this.permisoService.eliminarComprobacion(evaluacion.id)
    .subscribe({
      next: () => {
        // 🔥 eliminar del array sin recargar
        persona.comprobacionesPrevias =
          persona.comprobacionesPrevias.filter((e: any) => e.id !== evaluacion.id);
      },
      error: () => {
        alert('Error eliminando la evaluación');
      }
    });
}


//firma del empleado en evaluacion

iniciarFirmaEvaluacion(
  event: MouseEvent | TouchEvent,
  p: any,
  canvas: HTMLCanvasElement
) {
  event.preventDefault();

  let ctx = this.ctxEvaluacionMap.get(p);
  if (!ctx) {
    ctx = canvas.getContext('2d')!;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    this.ctxEvaluacionMap.set(p, ctx);
  }

  this.firmandoEvaluacionMap.set(p, true);

  const { x, y } = this.getPosEvaluacion(event, canvas);
  ctx.beginPath();
  ctx.moveTo(x, y);
}


dibujarFirmaEvaluacion(
  event: MouseEvent | TouchEvent,
  p: any,
  canvas: HTMLCanvasElement
) {
  if (!this.firmandoEvaluacionMap.get(p)) return;
  event.preventDefault();

  const ctx = this.ctxEvaluacionMap.get(p)!;
  const { x, y } = this.getPosEvaluacion(event, canvas);

  ctx.lineTo(x, y);
  ctx.stroke();
}


terminarFirmaEvaluacion(p: any, canvas: HTMLCanvasElement) {
  this.firmandoEvaluacionMap.set(p, false);

  const ctx = this.ctxEvaluacionMap.get(p);
  ctx?.closePath();

  p.firmaEmpleadoBase64 = canvas.toDataURL('image/png');
}

getPosEvaluacion(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();

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

limpiarFirmaEvaluacion(p: any, canvas: HTMLCanvasElement) {
  const ctx = this.ctxEvaluacionMap.get(p);
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  p.firmaEmpleadoBase64 = null;
}

//METODO PARA DESPLEGAR PERSONAL

togglePersonal(permiso: any) {
  permiso.mostrarPersonal = !permiso.mostrarPersonal;

  if (permiso.mostrarPersonal) {
    permiso.cargandoPersonal = true;

    // Solicita siempre el personal actualizado del backend
    this.permisoService.obtenerPersonal(permiso.id).subscribe({
      next: (personal: any[]) => {
        permiso.personalAutorizado = [...personal.map(p => ({
  ...p,
  mostrandoComprobacion: false,
  formComprobacion: null,
  comprobacionesPrevias: []
}))];
        permiso.cargandoPersonal = false;
      },
      error: () => {
        permiso.personalAutorizado = []; // 🔥 si falla, limpiar array
        permiso.cargandoPersonal = false;
      }
    });
  }
}



//VER DETALLES DEL PERMISO
verDetalle(id: number) {
  this.router.navigate(['/permiso-alturas-detalle', id]);
}

getCanvasByPermiso(permisoId: number): HTMLCanvasElement | null {
  const canvasRef = this.canvasList?.find(
    c => c.nativeElement.dataset['permisoId'] == permisoId.toString()
  );
  return canvasRef ? canvasRef.nativeElement : null;
}

  // Métodos agregar

crearFormPersona() {
  return this.fb.group({
    nombres: ['',Validators.required],
    empleadoId: [null],
    certificacion: [''],
    activoSeguridadSocial: [false]
  });
}


toggleFormularioPersona(permiso: any) {
  permiso.mostrarFormularioPersona = !permiso.mostrarFormularioPersona;

  if (permiso.mostrarFormularioPersona && !permiso.formPersona) {
    permiso.formPersona = this.crearFormPersona();
  }
}

guardarPersona(permiso: any) {
  if (permiso.formPersona.invalid) return;

  const persona = permiso.formPersona.value;

  this.permisoService.agregarPersonal(permiso.id, persona).subscribe({
    next: (res) => {

      if (!permiso.personalAutorizado) {
        permiso.personalAutorizado = [];
      }

      permiso.personalAutorizado.push({
        ...res,
        mostrandoComprobacion: false,
        formComprobacion: null,
        comprobacionesPrevias: [],
        
      });
      permiso.mostrarFormularioPersona = false;
      permiso.formPersona.reset();
      alert('Agregado exitosamente');
    },
    error: (err) => {
      console.error(err);
      alert('Error guardando persona');
    }
  });
}

eliminarPersona(permiso: any, persona: any) {
  if (!confirm(`¿Seguro que deseas eliminar a ${persona.nombres}?`)) return;
  
  this.permisoService.eliminarPersonal(persona.id)
    .subscribe({
      next: () => {
        // 🔥 quitar del array sin recargar
        permiso.personalAutorizado =
          permiso.personalAutorizado.filter((p: any) => p.id !== persona.id);
          alert('Eliminado exitosamente');
      },
      error: () => {
        alert('Error eliminando la persona');
      }
    });
}

 agregarResponsablePlanEmergencia() {
  this.responsablesPlanEmergencia.push(
    this.fb.group({
      nombres: [''],
      empleadoId: [null]
    })
  );
}


//firma responsable 


  inicializarFirmaResponsable() {
  if (!this.canvasFirmaResponsable) return;

  this.ctxFirma = this.canvasFirmaResponsable
    .nativeElement
    .getContext('2d')!;

  this.ctxFirma.lineWidth = 2;
  this.ctxFirma.lineCap = 'round';
  this.ctxFirma.strokeStyle = '#000';
}

iniciarFirmaResponsable(event: MouseEvent | TouchEvent) {
  event.preventDefault();
  this.firmandoResponsable = true;

  const { x, y } = this.getPosFirmaResponsable(event);
  this.ctxFirma.beginPath();
  this.ctxFirma.moveTo(x, y);
}

dibujarFirmaResponsable(event: MouseEvent | TouchEvent) {
  if (!this.firmandoResponsable) return;
  event.preventDefault();

  const { x, y } = this.getPosFirmaResponsable(event);
  this.ctxFirma.lineTo(x, y);
  this.ctxFirma.stroke();
}

terminarFirmaResponsable() {
  this.firmandoResponsable = false;
  this.ctxFirma.closePath();

  const canvas = this.canvasFirmaResponsable.nativeElement;
  this.firmaResponsableBase64 = canvas.toDataURL('image/png');
}


getPosFirmaResponsable(event: MouseEvent | TouchEvent) {
  const rect =
    this.canvasFirmaResponsable.nativeElement.getBoundingClientRect();

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


limpiarFirmaResponsable() {
  const canvas = this.canvasFirmaResponsable.nativeElement;
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
  this.firmaResponsableBase64 = null;
}

guardar() {
  const data = {
    ...this.form.value,
    trabajoElectrico: this.form.value.permisoTrabajoElectrico,
    firmaResponsableBase64: this.firmaResponsableBase64,

    responsablesPlanEmergencia: this.responsablesPlanEmergencia.value.map((r:any)=> ({
      id: r.id,                 // null → nuevo
      empleadoId: r.empleadoId,// quién es el responsable
      nombres: r.nombres 
    }))
  };

  if (this.modoEdicion) {
  this.permisoService.actualizar(this.permisoId.toString(), data).subscribe({
    next: () => {
      alert('Permiso actualizado con éxito');
      this.form.reset();               // limpiar formulario
      this.empleadoVisual = {};        // limpiar autocomplete
      this.firmaResponsableBase64 = null; // limpiar firma
      this.mostrarFormulario = false;  // cerrar el formulario
      this.cargarPermisos();           // refrescar lista de permisos si aplica
    },
    error: () => alert('Error al actualizar')
  });
} else {
    this.permisoService.crear(data).subscribe({
      next: () => {
        alert('Permiso creado con éxito');
        this.form.reset();
        this.empleadoVisual = {};
        this.firmaResponsableBase64 = null;
        this.cargarPermisos();
        this.mostrarFormulario = false;
      }
    });
  }
}



  onMedidaToggle(valor: string, event: any) {
  if (event.target.checked) {
    if (!this.medidasSeleccionadas.includes(valor)) {
      this.medidasSeleccionadas.push(valor);
    }
  } else {
    this.medidasSeleccionadas =
      this.medidasSeleccionadas.filter(x => x !== valor);
  }

  // Guardamos como JSON string
  this.form.get('medidaPrevencionProteccion')
    ?.setValue(JSON.stringify(this.medidasSeleccionadas));
  }

  onProteccionToggle(valor: string, event: any) {
    if (event.target.checked) {
      if (!this.proteccionSeleccionada.includes(valor)) {
        this.proteccionSeleccionada.push(valor);
      }
    } else {
      this.proteccionSeleccionada =
        this.proteccionSeleccionada.filter(x => x !== valor);
    }

    this.form.get('proteccionPersonal')
      ?.setValue(JSON.stringify(this.proteccionSeleccionada));
  }

  toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;

  if (this.mostrarFormulario) {
    setTimeout(() => this.inicializarFirmaResponsable(), 0);
  }
}


  trackByPermiso(index: number, permiso: any) {
  return permiso.id || index; 
}

convertirImagenABase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
  });
}

exportarPdf(permiso: any, persona: any, evaluacion: any) {
    this.pdfService.descargarEvaluacion(
      permiso.id,
      persona.id,
      evaluacion.id,
      persona.nombres
    );
  }

private escribirTexto(
  doc: jsPDF,
  texto: string,
  x: number,
  y: number,
  ancho: number,
  lineHeight = 5
): number {
  const lineas = doc.splitTextToSize(texto, ancho);
  doc.text(lineas, x, y);
  return y + lineas.length * lineHeight;
}

private validarSaltoPagina(
  doc: jsPDF,
  y: number,
  espacioNecesario = 20
): number {
  if (y + espacioNecesario > 280) {
    doc.addPage();
    return 15;
  }
  return y;
}
  exportarPdfEvaluacion(permiso: any, persona: any, evaluacion: any) {
    this.pdfService.descargarEvaluacion(
      permiso.id,
      persona.id,
      evaluacion.id,
      persona.nombres
    );
  }
}


