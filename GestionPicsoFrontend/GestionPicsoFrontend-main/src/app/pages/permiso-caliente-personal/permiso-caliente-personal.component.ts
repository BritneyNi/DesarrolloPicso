import { Component, OnInit,ElementRef,ViewChildren,QueryList,HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PermisoCalientePersonalService } from '../../services/permiso-caliente-personal.service';
import {EmpleadoService } from '../../services/empleado-service.service';
import { CommonModule } from '@angular/common';
import { PermisoCalienteEvaluacionesService } from '../../services/permiso-caliente-evaluaciones.service';
import jsPDF from 'jspdf';
import { PermisoCalientePdfService } from '../../services/permiso-caliente-pdf.service';
import { PermisoEnCalienteService,PermisoEnCaliente } from '../../services/permiso-caliente.service';
import { NavbarComponent } from "../../navbar/navbar.component";
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";

interface ItemEvaluacion {
  item: string;
  respuesta: 'SI' | 'NO' | 'NA' | null;
  dias: {
    L: boolean;
    M: boolean;
    X: boolean;
    J: boolean;
    V: boolean;
    S: boolean;
    D: boolean;
  };
}
const ITEMS_EVALUACION_PERMISO_CALIENTE = [
  '¿Se cuenta con un ayudante que valide alguna condicion anormal de conato de incendios? ',
  '¿Se retiró o protegió en un radio de 5 mts, todo peligro de incendio o explosión(materiales,combustibles,pinturas,aceites,grasas,solventes,gases comprimidos, otros)? En caso de proteger especificar los controles en OBSERVACIONES',
  '¿En caso de no ser posible retirar el material combustible e inflamable se tienen cubiertos adecuadamente con material ignifugo?',
  '¿Se cuenta con un extintor multipropósito ubicado a 2 m como maximo del area de trabajo?','¿Se dispone de equipos de aislamiento(mamparas,biombos,cabinas entre otros)?',
  '¿Si el trabajo en caliente se combina con otras tareas de alto riesgo se han consultado y diligenciado otros permisos?',
  '¿Los equipos usados en el trabajo en caliente fueron inspeccionados antes de su uso de cada una de sus partes?',
  '¿Los equipos a utilizar en los trabajos en caliente cuentan con: ficha tecnica,registros de mantenimiento y hoja de vida?',
  '¿Los cilindros de los equipos de oxicortes se encuentran rotulados y etiquetado?','¿Los equipos de soldadura se encuentran almacenados adecuadamente?',
  '¿Las extensiones electricas de los equipos de soldaduira electrica se encuentran en buen estado?',
  '¿Las areas de circulacion se encuentran libre de obstaculos (limpias y sin materiales que puedan ocasionar caidas)?',
  '¿Se cuenta con la elaboracion y divulgacion del analisis de trabajo seguro?',
  '¿Las personas que participan de los trabajos en caliente cuentan con los EPP requeridos de acuerdo a los peligros y riesgos asociados a la actividad?',
  '¿El equipo de oxicorte cuenta con valvulas anti-retorno de llama en las dos mangueras hacia los cilindros?',
  '¿Los accesorios(tenazas,cables,uniones,otros)estan en adecuadas condiciones operativas?',
  '¿Las mangueras del equipo de oxicorte estan aseguradas a sus conexiones por presion y no con abrazaderas?',
  '¿Los equipos para soldar cuentan con su respectiva linea a tierra?','¿El area de intervencion se encuentra delimitada y señalizada adecuadamente?',
  '¿Las herramientras de fuerza motriz mantienen sus cables en buen estado, y no se conectan directos a la energia?',
  '¿Se cuenta con un disco de corte adecuado para el tipo de material que se desea cortar y llave para realizar cambio del disco cuando se encuentre desgastado?',
  '¿Las herramientas de fuerza motris que poseen disco de corte cuentan con guarda de seguridad y mango auxiliar?',
  '¿Para el uso de herramienta motriz como pulidora, el operador ha recibido capacitacion o entrenamiento de acuerdo al uso adecuado de la maquina y los riesgos relacionados a la actividad?',
  '¿Han recibido entrenamiento los soldadores o y ayudantes en los riesgos presentes en el area de trabajo?',
  '¿Los cilindros del equipo de oxicorte son transportado en carretilla de forma vertical y asegurados con cadenas?','¿Se cuenta con un kit de primeros auxilios en el area de trabajo?',
  '¿Los equipos de soldadura o herramientras de corte se almacenana en un lugar adecuado despues de ser utilizados?',
  '¿Al finalizar la actividad el area fue dejada en buenas condiciones de orden y aseo?',
  '¿El encargado de SST inspecciona 30 minutos despues de finalizado el trabajo, a gin de verificar que no se haga originado algun incendio?'
];
@Component({
  selector: 'app-permiso-caliente-personal',
  styleUrls:['./permiso-caliente-personal-component.css'],
  templateUrl: './permiso-caliente-personal.component.html',
  standalone:true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent]
})

export class PermisoCalientePersonalComponent implements OnInit {

  busquedaEmpleado: string = '';
  empleadosFiltrados: any[] = [];
  empleadoSeleccionado: any = null;

  permisoId!: number;
  empleados: any[] = [];
  personal: any[] = [];

  empleadoIdSeleccionado: number | null = null;

  cargando = false;

  // Firma
  @ViewChildren('canvas') canvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  canvasActual?: ElementRef<HTMLCanvasElement>;
  ctx: CanvasRenderingContext2D | null = null;
  isDrawing = false;

  personalFirmandoIndex: number | null = null;

  mostrarListadoEvaluaciones = false;
  evaluacionesRealizadas: any[] = [];

// ===============================
// Evaluación
// ===============================
mostrarEvaluacion = false;
personalEvaluando: any = null;
evaluacion: ItemEvaluacion[] = [];
modoLectura = false;
evaluacionActualId: number | null = null;

permiso: PermisoEnCaliente | null = null;

readonly FONT_NORMAL = 10;
readonly FONT_SMALL = 9;
readonly FONT_TITLE = 12;

@HostListener('document:keydown.escape')
onEsc() {
  if (this.mostrarEvaluacion) {
    this.cerrarEvaluacion();
  }

  if (this.mostrarListadoEvaluaciones) {
    this.mostrarListadoEvaluaciones = false;
  }
}


  constructor(
    private route: ActivatedRoute,
    private personalService: PermisoCalientePersonalService,
    private evaluacionesService: PermisoCalienteEvaluacionesService,
    private empleadoService: EmpleadoService,
    private permisoService: PermisoEnCalienteService,
    private pdfService: PermisoCalientePdfService
  ) {}
  ngOnInit(): void {
    this.permisoId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarPermiso();
    this.cargarEmpleados();
    this.cargarPersonal();
  }
  

  filtrarEmpleadosPersonal() {
  const texto = this.busquedaEmpleado.toLowerCase();

  if (!texto) {
    this.empleadosFiltrados = [];
    return;
  }

  this.empleadosFiltrados = this.empleados.filter(e =>
    e.nombreCompleto.toLowerCase().includes(texto)
  );
}

seleccionarEmpleadoPersonal(emp: any) {
  this.empleadoSeleccionado = emp;
  this.empleadoIdSeleccionado = emp.id;

  this.busquedaEmpleado = emp.nombreCompleto;
  this.empleadosFiltrados = [];
}



  cargarPermiso() {
  this.permisoService.obtener(this.permisoId).subscribe(p => {
    this.permiso = p;
  });
}


  verEvaluaciones(p: any) {
  this.personalEvaluando = p;

  this.evaluacionesService
    .obtenerPorPersonal(p.id)
    .subscribe(lista => {
      this.evaluacionesRealizadas = lista;
      this.mostrarListadoEvaluaciones = true;
      this.modoLectura = true;
    });
}


verEvaluacion(evaluacionId: number) {
  this.evaluacionesService.obtener(evaluacionId).subscribe(resp => {
    this.evaluacion = JSON.parse(resp.evaluacionJson);
    this.evaluacionActualId = evaluacionId;
    this.mostrarListadoEvaluaciones = false;
    this.mostrarEvaluacion = true;
    this.modoLectura = true;
    
  });
}

eliminarEvaluacion(id: number) {
  if (!confirm('¿Está seguro de eliminar esta evaluación?')) return;

  this.evaluacionesService.eliminar(id).subscribe(() => {
    this.evaluacionesRealizadas =
      this.evaluacionesRealizadas.filter(e => e.id !== id);
  });
}


crearEvaluacionBase(): ItemEvaluacion[] {
  return ITEMS_EVALUACION_PERMISO_CALIENTE.map(texto => ({
    item: texto,
    respuesta: null,
    dias: {
      L: false,
      M: false,
      X: false,
      J: false,
      V: false,
      S: false,
      D: false
    }
  }));
}


abrirEvaluacion(p: any) {
  this.personalEvaluando = p;
  this.modoLectura = false;
  this.evaluacion = this.crearEvaluacionBase();
  this.mostrarEvaluacion = true;
}


guardarEvaluacion() {

  // 🔎 1. Validar que haya info real
  const tieneDatos = this.evaluacion.some(item => {
    const tieneRespuesta = !!item.respuesta;

    const tieneDiasMarcados = Object.values(item.dias || {})
      .some(v => v === true);

    return tieneRespuesta || tieneDiasMarcados;
  });

  if (!tieneDatos) {
    alert('Debe diligenciar al menos un ítem de la evaluación');
    return;
  }

  // 🧹 2. (Opcional pero recomendado) filtrar solo lo lleno
  const evaluacionFiltrada = this.evaluacion.filter(item => {
    const tieneRespuesta = !!item.respuesta;
    const tieneDiasMarcados = Object.values(item.dias || {})
      .some(v => v === true);

    return tieneRespuesta || tieneDiasMarcados;
  });

  // 📦 3. Guardar solo lo válido
  const json = JSON.stringify(evaluacionFiltrada);

  this.evaluacionesService.crear({
    personalId: this.personalEvaluando.id,
    evaluacionJson: json
  }).subscribe(() => {

    alert('Evaluación guardada exitosamente');

    this.personalEvaluando.tieneEvaluacion = true;

    // 🔥 LIMPIAR TODO
    this.evaluacion = [];
    this.personalEvaluando = null;
    this.modoLectura = false;
    this.mostrarEvaluacion = false;

  });
}

cerrarEvaluacion() {
  this.mostrarEvaluacion = false;
  this.evaluacion = [];
  this.personalEvaluando = null;
  this.evaluacionActualId = null;
  this.modoLectura = false;
}

//logo para el pdf 

cargarImagenBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

//header del pdf
private dibujarHeader(doc: jsPDF, logoBase64: string) {

  doc.addImage(logoBase64, 'PNG', 5, 3, 40, 20);

  // Header técnico
  doc.setFontSize(this.FONT_SMALL);
  doc.setFont('helvetica', 'normal');
  doc.text('Código: SST-FR-09', 200, 11, { align: 'right' });
  doc.text('Versión: 3', 200, 15, { align: 'right' });
  doc.text('Fecha: 11/08/2025', 200, 19, { align: 'right' });

  // Título principal
  doc.setFontSize(this.FONT_TITLE);
  doc.setFont('helvetica', 'bold');
  doc.text('PERMISO DE TRABAJO EN CALIENTE', 105, 13, { align: 'center' });
  doc.text('PARA ALTAS Y BAJAS TEMPERATURAS', 105, 19, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(10, 25, 200, 25);
}


// datos del permiso para el pdf
private dibujarDatosPermiso(doc: jsPDF, permiso: any, y: number): number {

  doc.setFontSize(this.FONT_NORMAL);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PERMISO', 10, y);
  y += 6;

  doc.setFont('helvetica', 'normal');

  doc.text(`Empresa: ${permiso.nombreEmpresa ?? ''}`, 10, y); y += 6;
  doc.text(`NIT: ${permiso.nit ?? ''}`, 10, y); y += 6;
  doc.text(`Proyecto: ${permiso.proyecto ?? ''}`, 10, y); y += 6;
  doc.text(`N° Permiso: ${permiso.numeroPermiso ?? ''}`, 10, y); y += 6;

  doc.text(
    `Fecha inicio: ${permiso.fechaInicio ?? ''}    Fecha cierre: ${permiso.fechaCierre ?? ''}`,
    10,
    y
  );
  y += 6;

  doc.text(`Tipo de trabajo: ${permiso.tipoTrabajo ?? ''}`, 10, y);
  y += 8;

  doc.text('Herramientas:', 10, y); y += 5;
  doc.text(permiso.herramientas ?? '—', 10, y, { maxWidth: 180 });
  y += 8;

  doc.text('Descripción de la tarea:', 10, y); y += 5;
  doc.text(permiso.descripcionTarea ?? '—', 10, y, { maxWidth: 180 });
  y += 10;

  return y;
}



//EPP y peligros para el pdf

private dibujarEppYPeligros(doc: jsPDF, permiso: any, y: number): number {

  doc.setFontSize(this.FONT_NORMAL);

  doc.setFont('helvetica', 'bold');
  doc.text('ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)', 10, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  (permiso.elementosProteccion?.length ? permiso.elementosProteccion : ['—'])
    .forEach((epp: string) => {
      doc.text(`• ${epp}`, 12, y);
      y += 5;
    });

  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text('PELIGROS IDENTIFICADOS', 10, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  (permiso.peligros?.length ? permiso.peligros : ['—'])
    .forEach((p: string) => {
      doc.text(`• ${p}`, 12, y);
      y += 5;
    });

  y += 8;
  return y;
}

//ubicacion de las firmas de empleado y autorizantes

private dibujarFirmasFinales(
  doc: jsPDF,
  trabajador: any,
  autorizantes: any[] | undefined,
  y: number
): number {

  const colIzqX = 10;
  const colDerX = 110;
  const anchoFirma = 70;
  let yIzq = y;
  let yDer = y;

  // =========================
  // TRABAJADOR (IZQUIERDA)
  // =========================
  doc.setFont('helvetica', 'bold');
  doc.text('TRABAJADOR', colIzqX, yIzq);
  yIzq += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(trabajador.empleado?.nombreCompleto ?? '—', colIzqX, yIzq);
  yIzq += 6;

  doc.text(`Cédula: ${trabajador.empleado?.cedula ?? '—'}`, colIzqX, yIzq);
  yIzq += 6;

  doc.text(`Cargo: ${trabajador.empleado?.cargo ?? '—'}`, colIzqX, yIzq);
  yIzq += 6;

  doc.text('Firma:', colIzqX, yIzq);
  yIzq += 4;

  if (trabajador.firmaBase64) {
    doc.addImage(
      trabajador.firmaBase64,
      'PNG',
      colIzqX,
      yIzq,
      anchoFirma,
      20
    );
    yIzq += 24;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('No registrada', colIzqX, yIzq);
    yIzq += 8;
  }

  // =========================
  // AUTORIZANTES (DERECHA)
  // =========================
  doc.setFont('helvetica', 'bold');
  doc.text('AUTORIZAN:', colDerX, yDer);
  yDer += 6;

  if (!autorizantes || autorizantes.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('No hay autorizantes', colDerX, yDer);
    yDer += 8;
  } else {
    autorizantes.forEach((a, i) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${a.empleado?.nombreCompleto ?? '—'}`, colDerX, yDer);
      yDer += 5;

      doc.text(`Cedula: ${a.empleado?.cedula ?? '—'}`, colDerX, yDer);
      yDer += 5;

       doc.text('Firma:', colDerX, yDer);
        yDer += 5;

      if (a.firmaBase64) {
        doc.addImage(
          a.firmaBase64,
          'PNG',
          colDerX,
          yDer,
          anchoFirma,
          18
        );
        yDer += 22;
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('Firma no registrada', colDerX, yDer);
        yDer += 8;
      }
    });
  }

  // devolvemos la mayor Y usada
  return Math.max(yIzq, yDer) + 6;
}


  async generarPdfEvaluacion() {
    if (!this.evaluacion || !this.personalEvaluando) return;
    const nombre = this.personalEvaluando.empleado?.nombreCompleto ?? 'trabajador';
    const evalId = this.evaluacionActualId ?? 0;
    this.pdfService.descargarEvaluacion(evalId, nombre);
  }






  cargarEmpleados() {
    this.empleadoService.obtenerEmpleados().subscribe(r => {
      this.empleados = r;
    });
  }

  cargarPersonal() {
    this.personalService.obtenerPorPermiso(this.permisoId).subscribe(r => {
      this.personal = r;
    });
  }

  agregarPersonal() {
    if (!this.empleadoIdSeleccionado) return;

    this.cargando = true;

    this.personalService
      .agregar(this.permisoId, this.empleadoIdSeleccionado)
      .subscribe(() => {
        this.empleadoIdSeleccionado = null;
        this.cargarPersonal();
        this.cargando = false;
        this.busquedaEmpleado = '';
        this.empleadoIdSeleccionado = null;
        this.empleadoSeleccionado = null;
        this.empleadosFiltrados = [];
      });
  }

  eliminarPersonal(id: number) {
    if (!confirm('¿Eliminar esta persona del permiso?')) return;

    this.personalService.eliminar(id).subscribe(() => {
      this.cargarPersonal();
      alert('Persona eliminada exitosamente');
    });
  }

   // ===============================
  // Firma
  // ===============================
abrirFirma(index: number) {
  this.personalFirmandoIndex = index;

  setTimeout(() => {
    const canvasRef = this.canvases.toArray()[index];
    if (!canvasRef) return;

    this.canvasActual = canvasRef;

    this.ctx = canvasRef.nativeElement.getContext('2d')!;
    if (!this.ctx) return;

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';
  });
}

//

start(event: MouseEvent | TouchEvent, canvasEl: HTMLCanvasElement) {
  event.preventDefault();

  this.canvasActual = new ElementRef(canvasEl);
  this.ctx = canvasEl.getContext('2d');
  if (!this.ctx) return;

  this.isDrawing = true;

  const { x, y } = this.getPosition(event, canvasEl);

  this.ctx.beginPath();
  this.ctx.moveTo(x, y);
}


draw(event: MouseEvent | TouchEvent) {
  if (!this.isDrawing || !this.ctx || !this.canvasActual) return;
  event.preventDefault();

  const canvas = this.canvasActual.nativeElement;
  const { x, y } = this.getPosition(event, canvas);

  this.ctx.lineTo(x, y);
  this.ctx.stroke();
}



end() {
  if (!this.isDrawing || !this.ctx) return;

  this.isDrawing = false;
  this.ctx.closePath();
}



getPosition(
  event: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  let clientX = 0;
  let clientY = 0;

  if (event instanceof TouchEvent) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}





 iniciarCanvas() {
  if (!this.canvasActual?.nativeElement) return;

  const canvasEl = this.canvasActual.nativeElement;
  const ctx = canvasEl.getContext('2d');

  if (!ctx) return;

  this.ctx = ctx;
  this.ctx.strokeStyle = 'black';
  this.ctx.lineWidth = 2;
}


 

  limpiar() {
  if (!this.ctx || !this.canvasActual?.nativeElement) return;

  const canvas = this.canvasActual.nativeElement;
  this.ctx.clearRect(0, 0, canvas.width, canvas.height);
}


guardarFirma() {
  if (
    this.personalFirmandoIndex === null ||
    !this.canvasActual?.nativeElement
  ) {
    return;
  }

  const canvas = this.canvasActual.nativeElement;
  const firmaBase64 = canvas.toDataURL('image/png');

  const p = this.personal[this.personalFirmandoIndex];
  const personalId = p.id; // 🔥 ESTE ES EL ID REAL DEL REGISTRO

  this.personalService
    .firmar(personalId, firmaBase64)
    .subscribe({
      next: () => {
        // ✔ actualizar UI
        p.firmaBase64 = firmaBase64;

        // ✔ cerrar canvas
        this.isDrawing = false;
        this.ctx = null;
        this.canvasActual = undefined;
        this.personalFirmandoIndex = null;
        alert('Firma guardada exitosamente');
      },
      error: err => {
        console.error('Error guardando firma', err);
      }
    });
}




}
