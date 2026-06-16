import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AtsService, Ats, Actividad } from '../../services/ats.service';
import { EmpleadoService } from '../../services/empleado-service.service';
import SignaturePad from 'signature_pad';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormsModule,FormArray,FormControl } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import jsPDF from 'jspdf';
import { AtsPdfService } from '../../services/ats-pdf.service';


const logoPicso = 'assets/img/Logopicso.png';

@Component({
  selector: 'app-ats',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NavbarComponent,
    BotonRegresarComponent
  ],
  templateUrl: './ats.component.html',
  styleUrls: ['./ats.component.css'],
  
})
export class AtsComponent implements OnInit {
  
  // ===============================
  // VIEWCHILDS
  // ===============================
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasEmpleado', { static: false }) canvasEmpleadoRef!: ElementRef<HTMLCanvasElement>;

  // ===============================
  // FORMULARIOS
  // ===============================
  atsForm!: FormGroup;       // Formulario principal para agregar actividad
  atsHijoForm!: FormGroup;   // Formulario para crear ATS principal

  // ===============================
  // VARIABLES DE INTERFAZ
  // ===============================
  signaturePad!: SignaturePad;               // Firma del responsable SST
  mostrarFormularioActividad: boolean = false;
  mostrarFormulario: boolean = false;

  // ===============================
  // BÚSQUEDAS Y FILTROS
  // ===============================
  busquedaRapida: string = '';
  listaAtsFiltrada: any[] = [];
  listaActividades: any[] = [];
  listaAtsPrincipales: any[] = [];

  empleados: any[] = [];
  empleadosFiltrados: any[] = [];
  empleadoNombreSeleccionado: string = '';

  responsables: any[] = [];
  responsablesFiltrados: any[] = [];
  responsableNombreSeleccionado: string = '';

  realizadoPorFiltrados: any[] = [];
  realizadoPorNombreSeleccionado: string = '';


  // ===============================
  // PELIGROS Y RIESGOS
  // ===============================
  peligrosListado = [
    "Físicos","Químicos","Biológicos","Ergonómicos","Seguridad","Psicosociales",
    "Mecánicos","Locativos","Públicos o sociales","Naturales"
  ];

  peligrosRiesgos: Record<string, string[]> = {
    "Físicos": ["Ruido","Iluminación deficiente o excesiva","Vibraciones mano-brazo o cuerpo entero",
                "Temperaturas extremas (calor/frío)","Presiones anormales","Radiaciones ionizantes y no ionizantes",
                "Ambiente hiperbárico","Electricidad"],
    "Químicos": ["Sustancias liquidas,sólidas o gaseosas","Vapores y nieblas","Humo, polvo y fibra",
                 "Sensibilizantes","Corrosivos","Carsinogénicos","Mutágenos","Tóxicos"],
    "Biológicos": ["Virus","Bacterias","Hongos","Parásitos","Animales","Picaduras","Materia orgánica en descomposición"],
    "Ergonómicos": ["Manipulación manual de cargas","Posturas prolongadas o forzadas","Movimientos repetitivos",
                    "Diseño inadecuado del puesto de trabajo","Tareas monótonas"],
    "Seguridad": ["Caidas a nivel y desnivel","Golpes, cortes o atrapamientos","Contacto con superficies calientes",
                  "Objetos que caen o se proyectan","Herramientas manuales","Incendios o explosiones","Espacios confinados",
                  "Trabajo en alturas","Vehiculos y maquinaria"],
    "Psicosociales": ["Carga laboral excesiva","Jornada extensa","Trabajo repetitivo","Acoso laboral","Liderazgo negativo",
                      "Estrés laboral crónico","Falta de autonomía y apoyo"],
    "Mecánicos": ["Partes móviles de máquinas","Energía mecánica","Rotación, corte, arrastre o aplastamiento"],
    "Locativos": ["Pisos en mal estado","Falta de orden y aseo","Desniveles","Escaleras dañadas","Iluminación insuficiente",
                  "Señalización inadecuada"],
    "Públicos o sociales": ["Robo","Atraco","Amenazas","Violencia externa","Alteraciones del orden público"],
    "Naturales": ["Inundaciones","Sismos","Rayos","Vendavales","Deslizamientos"]
  };

  riesgosFiltrados: string[] = [];
  riesgosPorPeligroSeleccionado: { [peligro: string]: string[] } = {};

  // ===============================
  // CONSTRUCTOR
  // ===============================
  constructor(
    private fb: FormBuilder,
    private atsService: AtsService,
    private sanitizer: DomSanitizer,
    private empleadoService: EmpleadoService,
    private pdfService: AtsPdfService
  ) {}
  ngOnInit(): void {
    this.inicializarFormulario();
    this.obtenerEmpleados();
    this.obtenerActividades();
  }

  onInputRealizadoPor(event: any) {
  const valor = event.target.value.toLowerCase();
  this.realizadoPorNombreSeleccionado = valor;

  this.realizadoPorFiltrados = valor
    ? this.empleados.filter(emp =>
        emp.estado === 'Activo' &&
        emp.nombreCompleto.toLowerCase().includes(valor)
      )
    : [];
}

seleccionarRealizadoPor(emp: any) {
  this.realizadoPorNombreSeleccionado = emp.nombreCompleto;
  this.atsHijoForm.patchValue({ responsableAts: emp.nombreCompleto });
  this.realizadoPorFiltrados = [];
}

onFocusRealizadoPor() {
  if (this.realizadoPorNombreSeleccionado.length > 0) {
    this.realizadoPorFiltrados = this.empleados.filter(e => e.estado === 'Activo');
  }
}


  // ===============================
  // INICIALIZACIÓN FORMULARIOS
  // ===============================
  inicializarFormulario() {
    this.atsForm = this.fb.group({
      empleadoId: ['', Validators.required],
      empresaContratista: ['', Validators.required],
      trabajoARealizar: ['', Validators.required],
      equiposAUtilizar: [''],
      equiposEmergencia: [''],
      fecha: [''],
      fechaFin: [''],
      tipoPermiso: this.fb.array([]),
      observacion: [' ']
    });
  }

  inicializarFormularioHijo() {
    this.atsHijoForm = this.fb.group({
      descripcionAts: ['', Validators.required],
      peligros: [[], Validators.required],
      riesgo: [[], Validators.required],
      controles: ['', Validators.required],
      queHacer: ['', Validators.required],
      responsableAts:['',Validators.required],
      responsable:['',Validators.required],
      fechaRegistro:['',Validators.required]
    });
  }


toggleRiesgo(riesgo: string, ats: any) {
  if (!Array.isArray(ats.riesgo)) {
    ats.riesgo = [];
  }

  const index = ats.riesgo.indexOf(riesgo);

  if (index >= 0) {
    // Si estaba marcado → quitarlo
    ats.riesgo.splice(index, 1);
  } else {
    // Si NO estaba → añadirlo
    ats.riesgo.push(riesgo);
  }
}

  //checkboxes de tipo permiso
  onCheckboxChange(e: any) {
  const permisos: FormArray = this.atsForm.get('tipoPermiso') as FormArray;

  if (e.target.checked) {
    permisos.push(new FormControl(e.target.value));
  } else {
    const index = permisos.controls.findIndex(x => x.value === e.target.value);
    if (index !== -1) {
      permisos.removeAt(index);
    }
  }
}


  // ===============================
  // FILTROS PELIGRO-RIESGO
  // ===============================
  onRiesgoToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const selectedRiesgos: string[] = this.atsHijoForm.value.riesgo || [];

    if (checkbox.checked) selectedRiesgos.push(checkbox.value);
    else {
      const index = selectedRiesgos.indexOf(checkbox.value);
      if (index > -1) selectedRiesgos.splice(index, 1);
    }

    this.atsHijoForm.patchValue({ riesgo: selectedRiesgos });
  }

  onPeligroToggle(event: any) {
  const peligro: string = event.target.value;
  const checked: boolean = event.target.checked;

  let peligrosSeleccionados: string[] = this.atsHijoForm.value.peligros || [];

  if (checked) {
    if (!peligrosSeleccionados.includes(peligro)) {
      peligrosSeleccionados.push(peligro);
    }

    this.riesgosPorPeligroSeleccionado[peligro] =
      this.peligrosRiesgos[peligro] || [];

  } else {
    peligrosSeleccionados = peligrosSeleccionados.filter(
      (p: string) => p !== peligro
    );

    delete this.riesgosPorPeligroSeleccionado[peligro];

    const riesgosActuales: string[] = this.atsHijoForm.value.riesgo || [];
    const riesgosPermitidos: string[] =
      Object.values(this.riesgosPorPeligroSeleccionado).flat();

    this.atsHijoForm.patchValue({
      peligros: peligrosSeleccionados,
      riesgo: riesgosActuales.filter((r: string) =>
        riesgosPermitidos.includes(r)
      )
    });
  }

  this.atsHijoForm.patchValue({ peligros: peligrosSeleccionados });
}
onPeligroToggleEdicion(event: Event, ats: any, peligro: string) {
  const checked = (event.target as HTMLInputElement).checked;

  if (!ats.peligrosArray) ats.peligrosArray = [];
  if (!ats.riesgosPorPeligro) ats.riesgosPorPeligro = {};

  if (checked) {
    ats.peligrosArray.push(peligro);
    ats.riesgosPorPeligro[peligro] =
      this.peligrosRiesgos[peligro] || [];
  } else {
    ats.peligrosArray = ats.peligrosArray.filter((p: string) => p !== peligro);
    delete ats.riesgosPorPeligro[peligro];

    // limpiar riesgos huérfanos
    const riesgosPermitidos = Object.values(ats.riesgosPorPeligro).flat();
    ats.riesgosArray = ats.riesgosArray.filter((r: string) =>
      riesgosPermitidos.includes(r)
    );
  }

  // volver a string para guardar luego
  ats.peligros = ats.peligrosArray.join(',');
  ats.riesgo = ats.riesgosArray.join(',');
}
onRiesgoToggleEdicion(event: Event, ats: any, riesgo: string) {
  const checked = (event.target as HTMLInputElement).checked;

  if (!ats.riesgosArray) ats.riesgosArray = [];

  if (checked) {
    if (!ats.riesgosArray.includes(riesgo)) {
      ats.riesgosArray.push(riesgo);
    }
  } else {
    ats.riesgosArray = ats.riesgosArray.filter(
      (r: string) => r !== riesgo
    );
  }

  ats.riesgo = ats.riesgosArray.join(',');
}


actualizarRiesgosPorPeligros(peligros: string[]) {
  const riesgosSet = new Set<string>();

  peligros.forEach(p => {
    (this.peligrosRiesgos[p] || []).forEach(r => riesgosSet.add(r));
  });

  this.riesgosFiltrados = Array.from(riesgosSet);

  // Limpia riesgos que ya no aplican
  const riesgosSeleccionados = this.atsHijoForm.value.riesgo || [];
  const riesgosValidos = riesgosSeleccionados.filter((r: string) =>
    this.riesgosFiltrados.includes(r)
  );

  this.atsHijoForm.patchValue({ riesgo: riesgosValidos });
}



  
  // ===============================
  // BÚSQUEDA Y SELECCIÓN DE RESPONSABLE
  // ===============================
  onInputResponsable(event: any) {
    const valor = event.target.value.toLowerCase();
    this.responsableNombreSeleccionado = valor;
    this.responsablesFiltrados = valor ? this.responsables.filter(emp =>
     emp.estado=='Activo' && emp.nombreCompleto.toLowerCase().includes(valor.toLowerCase())
    ) : [];
  }

  seleccionarResponsable(emp: any) {
    this.responsableNombreSeleccionado = emp.nombreCompleto;
    this.atsHijoForm.patchValue({ responsable: emp.nombreCompleto });
    this.responsablesFiltrados = [];
  }

  onFocusResponsable() {
    if (this.responsableNombreSeleccionado.length > 0) this.responsablesFiltrados = this.responsables;
  }

  // ===============================
  // BÚSQUEDA Y SELECCIÓN DE EMPLEADOS
  // ===============================
onInputEmpleado(event: Event) {
  const value = (event.target as HTMLInputElement)?.value || '';
  this.empleadoNombreSeleccionado = value;
  this.empleadosFiltrados = value ? this.empleados.filter(e => 
    e.estado === 'Activo' && e.nombreCompleto.toLowerCase().includes(value)
  ) : [];
}

onFocusEmpleado() {
  if (this.empleadoNombreSeleccionado.length > 0) this.filtrarEmpleados(this.empleadoNombreSeleccionado);
}

filtrarEmpleados(termino: string) {
  const lower = termino.toLowerCase();
  this.empleadosFiltrados = this.empleados.filter(e =>
    e.estado === 'Activo' && e.nombreCompleto.toLowerCase().includes(lower)
  );
}

seleccionarEmpleado(emp: any) {
  this.atsForm.patchValue({ empleadoId: emp.id });
  this.empleadoNombreSeleccionado = emp.nombreCompleto;
  this.empleadosFiltrados = [];
}


  // ===============================
  // OBTENER DATOS DESDE SERVICIOS
  // ===============================
  obtenerEmpleados() {
    this.empleadoService.obtenerEmpleados().subscribe({
      next: res => {
        this.empleados = res;
        this.empleadosFiltrados = res;
        this.responsables = res;
        this.responsablesFiltrados = res;
        this.obtenerAtsPrincipales(); // cargar ATS después de empleados
      },
      error: err => console.error(err)
    });
  }

  obtenerActividades() {
    this.atsService.getAll().subscribe({
      next: res => {
        this.listaActividades = res.map((a: any) => ({
          ...a,
          firmaEmpleadoSafe: this.sanitizer.bypassSecurityTrustResourceUrl(a.FirmaEmpleado)
        }));
      }
    });
  }

  obtenerAtsPrincipales() {
    this.atsService.getAtsPrincipales().subscribe({
      next: res => {
        this.listaAtsPrincipales = res.map(ats => ({
          ...ats,
          
          mostrarFormularioActividad: false,
          mostrarSubtabla: false,
          firmaSstSafe: this.sanitizer.bypassSecurityTrustResourceUrl(ats.firmaSst ?? ' '),
          atsList: (ats.actividades ?? []).map(act => ({
            ...act,
            firmaEmpleadoSafe: this.sanitizer.bypassSecurityTrustResourceUrl(act.firmaEmpleado || '')
          }))
        }));
      },
      error: err => console.error(err)
    });
  }

  // ===============================
  // FUNCIONES FIRMA
  // ===============================
  limpiarFirma() { this.signaturePad.clear(); }

  limpiarFirmaEmpleado(ats: any) { ats.signaturePadEmpleado?.clear(); }

  setupSignaturePadEmpleado(canvasEl: HTMLCanvasElement): SignaturePad {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvasEl.getBoundingClientRect();
    canvasEl.width = rect.width * ratio;
    canvasEl.height = rect.height * ratio;
    canvasEl.getContext('2d')?.scale(ratio, ratio);

    const ctx = canvasEl.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    }

    const pad = new SignaturePad(canvasEl, {
      minWidth: 2,
      maxWidth: 2,
      penColor: 'black',
      backgroundColor: 'white'
    });

    canvasEl.style.touchAction = 'none';
    canvasEl.style.width = `${rect.width}px`;
    canvasEl.style.height = `${rect.height}px`;

    return pad;
  }

  toggleFormularioActividad(ats: any) {
    ats.mostrarFormularioActividad = !ats.mostrarFormularioActividad;

    if (ats.mostrarFormularioActividad) {
      setTimeout(() => {
        const canvasEl = this.canvasEmpleadoRef.nativeElement;
        ats.signaturePadEmpleado = this.setupSignaturePadEmpleado(canvasEl);
      }, 50);
    } else {
      ats.signaturePadEmpleado?.clear();
    }
  }

  // ===============================
  // EXPORTACIÓN PDF
  // ===============================
// ==============================
// MÉTODO AUXILIAR: CARGA LOGO BASE64
// ==============================
private loadImageAsBase64(url: string): Promise<string> {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    }));
}

// ==============================
// MÉTODO UNIVERSAL PARA UNA PÁGINA
// ==============================
private generarPaginaPdf(doc: jsPDF, ats: Ats, empleado: Actividad, logoBase64: string) {
  const cleanBase64 = logoBase64.replace(/^data:image\/png;base64,/, '');
  const wrap = (txt: string, width: number = 180) => doc.splitTextToSize(txt || '', width);
  const maxWidth = 180;

  // ============================================
  // ENCABEZADO
  // ============================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Código: PS-SST-04', 200, 12, { align: 'right' });
  doc.text('Versión: 2', 200, 16, { align: 'right' });
  doc.text('Fecha: 11/08/2025',200,20,{align: 'right'})
  /*const fechaReg = ats.fechaRegistro
    ? new Date(ats.fechaRegistro + 'T00:00:00').toLocaleDateString()
    : '';
  doc.text(`Fecha registro: ${fechaReg}`, 200, 20, { align: 'right' });*/

  doc.addImage(cleanBase64, 'PNG', 2, 1, 50, 25);

  doc.setLineWidth(0.5);
  doc.rect(5, 5, 200, 287);

  // --- TITULO ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Análisis de Trabajo Seguro', 105, 22, { align: 'center' });

  // VOLVER A NORMAL
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.setLineWidth(0.3);
  doc.line(10, 30, 200, 30);

  // ============================================
  // SECCIÓN ATS
  // ============================================
  let yAts = 40;
  const x = 14;

  const fechaInicio = empleado.fecha ? new Date(empleado.fecha).toLocaleDateString() : '';
  const fechaFin = empleado.fechaFin ? new Date(empleado.fechaFin).toLocaleDateString() : '';

  const fInicio = wrap(`Fecha inicio: ${fechaInicio}`, maxWidth);
  const fFin = wrap(`Fecha fin: ${fechaFin}`, maxWidth);
  const proyecto = wrap(`Proyecto: ${empleado.empresaContratista}`, maxWidth);
  const responsable = wrap(`Realizado por: ${ats.responsableAts}`, maxWidth);
  const trabajoARealizar = wrap(`Trabajo a realizar: ${empleado.trabajoARealizar}`, maxWidth);
  const equiposAUtilizar = wrap(`Equipos a utilizar: ${empleado.equiposAUtilizar}`, maxWidth);
  const equiposEmergencia = wrap(`Equipo de emergencia: ${empleado.equiposEmergencia}`, maxWidth);
  const tipoPermiso = wrap(`Tipo de permiso: ${empleado.tipoPermiso}`, maxWidth);

  const altoAts =
    (fInicio.length + fFin.length + proyecto.length + responsable.length +
     trabajoARealizar.length + equiposAUtilizar.length + equiposEmergencia.length +
     tipoPermiso.length) * 6 + 12;

  doc.rect(10, 32, 190, altoAts - 5);

  doc.text(fInicio, x, yAts); yAts += fInicio.length * 6;
  doc.text(fFin, x, yAts); yAts += fFin.length * 6;
  doc.text(proyecto, x, yAts); yAts += proyecto.length * 6;
  doc.text(responsable, x, yAts); yAts += responsable.length * 6;
  doc.text(trabajoARealizar, x, yAts); yAts += trabajoARealizar.length * 6;
  doc.text(equiposAUtilizar, x, yAts); yAts += equiposAUtilizar.length * 6;
  doc.text(equiposEmergencia, x, yAts); yAts += equiposEmergencia.length * 6;
  doc.text(tipoPermiso, x, yAts); yAts += tipoPermiso.length * 6;

  // ============================================
  // ACTIVIDAD
  // ============================================
  let yActividad = yAts + 12;

  const act1 = wrap(`Actividad: ${ats.descripcion}`, maxWidth);
  const act2 = wrap(`Peligros: ${ats.peligros}`, maxWidth);
  const act5 = wrap(`Riesgos: ${ats.riesgo}`, maxWidth);
  const act3 = wrap(`Qué puede suceder: ${ats.queSucede}`, maxWidth);
  const act4 = wrap(`Qué debo hacer: ${ats.queHacer}`, maxWidth);

  const getHeight = (txt: string[]) => txt.length * 6;

  const altoActividad = 
    getHeight(act1) + getHeight(act2) + getHeight(act5) +
    getHeight(act3) + getHeight(act4) + 12;

  doc.rect(10, yAts + 5, 190, altoActividad - 7);

  doc.text(act1, 14, yActividad); yActividad += act1.length * 6;
  doc.text(act2, 14, yActividad); yActividad += act2.length * 6;
  doc.text(act5, 14, yActividad); yActividad += act5.length * 6;
  doc.text(act3, 14, yActividad); yActividad += act3.length * 6;
  doc.text(act4, 14, yActividad); yActividad += act4.length * 6;

  // ============================================
  // FIRMAS
  // ============================================
  const yFirmas = yActividad + 8;

  const eNombre = wrap(`Empleado: ${empleado.empleado?.nombreCompleto}`, 80);
  const rNombre = wrap(`Responsable: ${ats.responsable}`, 80);
  const eCedula = wrap(`Cédula: ${empleado.empleado?.cedula}`, 80);
  const eCargo = wrap(`Cargo: ${empleado.empleado?.cargo}`, 80);
  const observacion = wrap(`Observaciones: ${empleado.observacion || ''}`, 90);

  const altoFirmas =
    (eNombre.length + rNombre.length + eCedula.length + eCargo.length) * 6 +
    90 + (observacion.length * 6);

  doc.rect(10, yFirmas, 190, altoFirmas);

  // --- EMPLEADO ---
  let yEmp = yFirmas + 10;

  doc.text(eNombre, 20, yEmp); yEmp += eNombre.length * 6 + 4;
  doc.text(eCedula, 20, yEmp); yEmp += eCedula.length * 6 + 4;
  doc.text(eCargo, 20, yEmp); yEmp += eCargo.length * 6 + 4;

  doc.text(observacion, 20, yFirmas + altoFirmas - 40);

  if (empleado.firmaEmpleado?.startsWith('data:image')) {
    const format = empleado.firmaEmpleado.includes('jpeg') ? 'JPEG' : 'PNG';
    const data = empleado.firmaEmpleado.replace(/^data:image\/(png|jpeg);base64,/, '');
    doc.addImage(data, format, 20, yFirmas + altoFirmas - 74, 50, 18);
  }

  doc.line(20, yFirmas + altoFirmas - 61, 80, yFirmas + altoFirmas - 61);
  doc.text('Firma Empleado', 20, yFirmas + altoFirmas - 56);

  // --- RESPONSABLE ---
  doc.text(rNombre, 110, yFirmas + 10);

  if (ats.firmaSst?.startsWith('data:image')) {
    const format = ats.firmaSst.includes('jpeg') ? 'JPEG' : 'PNG';
    const data = ats.firmaSst.replace(/^data:image\/(png|jpeg);base64,/, '');
    doc.addImage(data, format, 110, yFirmas + altoFirmas - 78, 50, 18);
  }

  doc.line(110, yFirmas + altoFirmas - 61, 170, yFirmas + altoFirmas - 61);
  doc.text('Firma Responsable', 110, yFirmas + altoFirmas - 56);
}

// ==============================
// MÉTODO MASIVO
exportarPdfMasivo(ats: Ats) {
    this.pdfService.descargarMasivo(ats.id!, ats.descripcion ?? 'ATS');
  }

  exportarPdfIndividual(ats: Ats, empleado: Actividad) {
    const nombre = empleado.empleado?.nombreCompleto ?? 'empleado';
    this.pdfService.descargarIndividual(ats.id!, empleado.id!, nombre);
  }

  // ===============================
  // FUNCIONES ATS PRINCIPALES
  // ===============================
  alternarFormularioAts() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) return;

    this.inicializarFormularioHijo();

    setTimeout(() => {
      if (!this.canvas) return;
      const canvasEl = this.canvas.nativeElement;
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.width = rect.width;
      canvasEl.height = rect.height;

      this.signaturePad = new SignaturePad(canvasEl, {
        minWidth: 2,
        maxWidth: 2,
        penColor: 'black',
        backgroundColor: 'rgba(255,255,255,1)'
      });

      canvasEl.style.touchAction = 'none';
    }, 0);
  }

  guardarAtsPrincipal() {
    if (!this.signaturePad || this.signaturePad.isEmpty()) {
      alert('Debe firmar antes de guardar.');
      return;
    }
    if (this.atsHijoForm.invalid) {
      alert('Por favor complete todos los campos obligatorios del ATS.');
      return;
    }

    const nuevoAts: Ats = {
      descripcion: this.atsHijoForm.value.descripcionAts,
      peligros: this.atsHijoForm.value.peligros.join(', '),
      riesgo: (this.atsHijoForm.value.riesgo || []).join(', '),
      queSucede: this.atsHijoForm.value.controles,
      queHacer: this.atsHijoForm.value.queHacer,
      firmaSst: this.signaturePad.toDataURL(),
      responsableAts: this.atsHijoForm.value.responsableAts,
      responsable: this.atsHijoForm.value.responsable,
      fechaRegistro: this.atsHijoForm.value.fechaRegistro
    };

    this.atsService.addAtsPrincipal(nuevoAts).subscribe({
      next: () => {
        this.atsHijoForm.reset();
        this.limpiarFirma();
        this.obtenerAtsPrincipales();
        alert('✅ Creado exitosamente');
      },
      error: err => {
        console.error('Error guardando ATS:', err);
        alert('Error al guardar ATS principal.');
      }
    });
  }

editarAts(ats: any) {
  ats.editable = true;

  // Inicializa el formulario si aún no existe
  if (!this.atsHijoForm) {
    this.inicializarFormularioHijo();
  }

  // Cargar datos normales
  this.atsHijoForm.patchValue({
    descripcionAts: ats.descripcion,
    controles: ats.queSucede,
    queHacer: ats.queHacer,
    responsableAts: ats.responsableAts,
    responsable: ats.responsable,
    fechaRegistro: ats.fechaRegistro
  });

  // 🔥 AQUÍ VA LO QUE TE FALTABA
  const peligrosArray = ats.peligros
    ? ats.peligros.split(',').map((p: string) => p.trim())
    : [];

  const riesgosArray = ats.riesgo
    ? ats.riesgo.split(',').map((r: string) => r.trim())
    : [];

  this.atsHijoForm.patchValue({
    peligros: peligrosArray,
    riesgo: riesgosArray
  });

  // 🔥 recalcular riesgos disponibles
  this.actualizarRiesgosPorPeligros(peligrosArray);
}

  
  cancelarAts(ats: any) { ats.editable = false; }

 guardarEdicionAts(ats: any) {

  // Convertir riesgo a string
  if (Array.isArray(ats.riesgo)) {
    ats.riesgo = ats.riesgo.join(', ');
  }

  // Construir SOLO el objeto que espera el backend
  const payload = {
    id: ats.id,
    descripcion: ats.descripcion,
    peligros: ats.peligros,
    riesgo: ats.riesgo,
    queSucede: ats.queSucede,
    queHacer: ats.queHacer,
    responsableAts: ats.responsableAts,
    responsable: ats.responsable,
    fechaRegistro: ats.fechaRegistro,

    // ⚠ IMPORTANTE → Esto lo exige el backend
    data: ats.data ?? null   // o "" o lo que necesite el backend
  };

  this.atsService.updateAts(ats.id, payload).subscribe({
    next: () => {
      ats.editable = false;
      alert('ATS actualizado con éxito.');
    },
    error: err => {
      console.error(err);
      alert('Error al actualizar ATS.');
    }
  });
}



  eliminarAts(ats: any) {
    this.atsService.deleteAts(ats.id).subscribe({
      next: () => {
        this.listaAtsPrincipales = this.listaAtsPrincipales.filter(x => x.id !== ats.id);
        this.listaAtsFiltrada = this.listaAtsFiltrada.filter(x => x.id !== ats.id);
        alert('✅ ATS eliminado exitosamente.');
      },
      error: err => { console.error(err); alert('❌ Error al eliminar ATS.'); }
    });
  }

  // ===============================
  // ACTIVIDADES
  // ===============================
  guardarActividad(ats: Ats) {
    if (this.atsForm.invalid) { alert('Complete todos los campos obligatorios'); return; }
    if (!ats.signaturePadEmpleado || ats.signaturePadEmpleado.isEmpty()) { alert('Debe firmar la actividad antes de guardarla.'); return; }

    const formValue = this.atsForm.value;
    const empleadoSeleccionado = this.empleados.find(e => e.id === formValue.empleadoId);
    if (!empleadoSeleccionado) { alert('Debe seleccionar un empleado válido.'); return; }

     const permisosComoString = Array.isArray(formValue.tipoPermiso)
    ? formValue.tipoPermiso.join(', ')
    : formValue.tipoPermiso;

    const actividadParaTabla: Actividad = {
      empleado: empleadoSeleccionado,
      empleadoId: empleadoSeleccionado.id,
      empresaContratista: formValue.empresaContratista,
      trabajoARealizar: formValue.trabajoARealizar,
      equiposAUtilizar: formValue.equiposAUtilizar,
      equiposEmergencia: formValue.equiposEmergencia,
      fecha: formValue.fecha,
      fechaFin: formValue.fechaFin,
      tipoPermiso: permisosComoString, 
      firmaEmpleado: ats.signaturePadEmpleado.toDataURL(),
      observacion: formValue.observacion
    };

    if (!ats.atsList) ats.atsList = [];
    ats.atsList.push(actividadParaTabla);

    const actividadParaBackend = { ...actividadParaTabla, AtsId: ats.id };
    delete actividadParaBackend.empleado;

    this.atsService.createInsideAts(ats.id!, actividadParaBackend).subscribe({
      next: resActividadCreada => {
        const index = ats.atsList!.indexOf(actividadParaTabla);
        if (index !== -1) ats.atsList![index] = { ...resActividadCreada, empleado: empleadoSeleccionado };
        this.atsForm.reset();
        this.empleadoNombreSeleccionado = '';
        ats.mostrarFormularioActividad = false;
        ats.signaturePadEmpleado?.clear();
        alert('Empleado agregado correctamente al ATS');
      },
      error: err => {
        console.error(err);
        alert('Error al guardar la actividad');
        ats.atsList = ats.atsList!.filter(a => a !== actividadParaTabla);
      }
    });
  }

  cancelarEdicion(actividad: any) { actividad.editando = false; }

  guardarCambiosActividad(actividad: any) {
    this.atsService.update(actividad.id, actividad).subscribe({
      next: () => { actividad.editando = false; alert('Actividad actualizada con éxito.'); },
      error: err => { console.error(err); alert('Error al actualizar la actividad.'); }
    });
  }

  eliminarActividad(act: Actividad, ats: Ats) {
    if (!confirm(`¿Seguro que quieres eliminar el empleado "${act.empleado?.nombreCompleto}"?`)) return;

    this.atsService.delete(act.id!).subscribe({
      next: () => {
        ats.atsList = ats.atsList?.filter(a => a.id !== act.id);
        alert('✅ Empleado eliminado');
      },
      error: (err) => { console.error(err); alert('❌ Error al eliminar la actividad.'); }
    });
  }

  // ===============================
  // FILTROS
  // ===============================
filtrarAts() {
  const termino = this.busquedaRapida.toLowerCase();

  // Filtrar sobre listaAtsPrincipales
  this.listaAtsFiltrada = this.listaAtsPrincipales.filter(ats =>
    (ats.responsableAts || '').toLowerCase().includes(termino) ||
    (ats.responsable || '').toLowerCase().includes(termino)
  );
}


/**
 * Retorna true si `permiso` existe en la cadena `tipoPermiso` (coma separada).
 * Útil para marcar los checkboxes al entrar en edición.
 */
permisoEnArray(tipoPermiso: string | undefined, permiso: string): boolean {
  if (!tipoPermiso) return false;
  const arr = tipoPermiso.split(',').map(p => p.trim());
  return arr.includes(permiso);
}

/**
 * Maneja el cambio de checkbox en edición. Recibe el evento y la actividad `act`.
 * Se reconstruye `act.tipoPermiso` como string separado por comas.
 */
onEditCheckboxChange(event: any, act: any) {
  const permiso = event.target.value;
  let permisos: string[] = [];

  if (act.tipoPermiso) {
    permisos = act.tipoPermiso.split(',').map((p: string) => p.trim());
  }

  if (event.target.checked) {
    // agregar permiso si no existe
    if (!permisos.includes(permiso)) {
      permisos.push(permiso);
    }
  } else {
    // quitar permiso
    permisos = permisos.filter(p => p !== permiso);
  }

  act.tipoPermiso = permisos.join(', ');
}


}
