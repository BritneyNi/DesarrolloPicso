import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { GanttService } from '../../services/gantt.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import 'chartjs-adapter-date-fns';
import { BaseChartDirective } from 'ng2-charts';
import { ViewChild } from '@angular/core';
import { Chart} from 'chart.js';
import { FormsModule } from '@angular/forms';
import { ActividadGanttDto } from '../../models/actividad-gantt.model';
import { ActivatedRoute } from '@angular/router';
import { EvidenciasGanttComponent } from '../evidencias-gantt/evidencias-gantt.component';
import { InformeGanttComponent } from '../informe-gantt/informe-gantt.component';

@Component({
  selector: 'app-gantt-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule,BotonRegresarComponent,NavbarComponent,FormsModule,EvidenciasGanttComponent,InformeGanttComponent],
  templateUrl: './gantt-dashboard.component.html',
  styleUrls:['./gantt-dashboard.component.css']

})

export class GanttDashboardComponent implements OnInit {

  private ganttService = inject(GanttService);
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('curvaSCanvas', { read: BaseChartDirective })
  curvaSCanvas?: BaseChartDirective;

  public minFecha: number = 0;
  public maxFecha: number = 0;
  spiProyecto: number = 1;
  spiProyectoPorcentaje: number = 0;
  mapaVisual: Record<string, string> = {};

  alertaProyecto: {
  tipo: string;
  mensaje: string;
} | null = null;

  alertasActividades: string[] = [];
  ganttSub: any;

  obraIdSeleccionada: number | null = null;
  obras: any[] = [];

  proyectoIdSeleccionado: number | null = null;
  proyectos: any[] = [];

  tituloPrincipal: string = 'Avance General de Actividades';

  mostrarModal = false;
  actividadEditando: any = null;

  nuevaActividad: any = {
  proyectoGanttId: null,
  nombre: '',
  fechaInicio: '',
  fechaFin: '',
  tipoUnidad: 'MTS',
  cantidadTotal: 0,
  precedenteId: null
  };

  tipoEscala: 'dia' | 'semana' | 'mes' = 'semana';

  mostrarModalProyecto = false;

  nuevoProyecto: {
  obraId: number | null;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
} = {
  obraId: null,
  nombre: '',
  fechaInicio: '',
  fechaFin: ''
};

  actividadSeleccionadaId: number | null = null;
  timelineGantt: Date[] = [];

  obraSeleccionada: any = null;
  timelineObra: Date[] = [];
  proyectoEditando: any = null;
  actividadesDelProyecto: any[] = [];

  fechaInicioProyecto: string | null = null;
  fechaFinProyecto: string | null = null;
  curvaSChartOptions: any;
  proyectosColapsados: Set<string> = new Set();

  curvaSImage: string | null = null;

  setObraSeleccionada(id: number | null) {

  this.obraIdSeleccionada = id;

   // 🔥 LIMPIEZA TOTAL
  this.ganttChartData = { labels: [], datasets: [] };
  this.timelineGantt = [];
  this.actividadSeleccionadaId = null;

  this.proyectos = [];
  this.proyectoIdSeleccionado = null;

  this.cargarProyectos();
  this.actualizarTitulo();

  // 🔥 esperar micro ciclo Angular
  setTimeout(() => {
    this.obtenerFechasObra();
    this.recargarTodo();
  });
}

public barChartData: ChartConfiguration<'bar'>['data'] = {
  labels: [],
  datasets: [
    {
      data: [],
      label: 'Avance (%)'
    }
  ]
};

public lineChartData: ChartConfiguration<'line'>['data'] = {
  labels: [],
  datasets: []
};

public lineChartOptions: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
  x: {
    type: 'category'
  },
  y: {
    beginAtZero: true,
    ticks: {
      callback: function(value: any) {
        return value + '%';
      }
    }
  }
},
  plugins: {
    tooltip: {
      callbacks: {
       label: (context) => {

        const valor = Number(context.raw);

        if (isNaN(valor)) return '';

        return `${context.dataset.label}: ${valor.toFixed(0)}%`;
      }
      }
    }
  }
};

  public ganttChartData: ChartConfiguration<'bar'>['data'] = {
  labels: [],
  datasets: [
    {
      data: [],
      label: 'Cronograma'
    }
  ]
};

public ganttChartOptions: ChartConfiguration<'bar'>['options'] = {
  indexAxis: 'y',
  scales: {
    x: {
      type: 'linear'
    }
  }
};

public curvaSChartData: ChartConfiguration<'line'>['data'] = {
  labels: [],
  datasets: []
};

modoRestringido: boolean = false;
private yaInicializoColapso = false;
private route = inject(ActivatedRoute);

  ngOnInit() {
  Chart.register(this.mesesSemanasPlugin as any);

  this.cargarObras();

  // 👇 CAPTURAR ID DE LA URL
  this.route.paramMap.subscribe(params => {
    const id = params.get('obraId');

if (id && id !== '0') {
  this.modoRestringido = true;
  this.obraIdSeleccionada = Number(id);

  this.setObraSeleccionada(this.obraIdSeleccionada);

} else {
  this.modoRestringido = false;

  this.cargarCurvaAvance();
  this.cargarGanttConMeses();
  this.cargarCurvaS();
}
  });
}

  abrirEditarProyecto(proyecto: any) {
  this.proyectoEditando = { ...proyecto };
  this.mostrarModalProyecto = true;
}

exportarCurvaSComoImagen(): string | null {
  if (!this.curvaSCanvas?.chart) return null;
  return this.curvaSCanvas.chart.toBase64Image('image/png', 1);
}

abrirModalProyecto() {

  this.nuevoProyecto = {
    obraId: this.obraIdSeleccionada ?? null,
    nombre: '',
    fechaInicio: '',
    fechaFin: ''
  };
  
  this.mostrarModalProyecto = true;
  
}

editarProyectoSeleccionado() {

  if (!this.proyectoIdSeleccionado) return;

  const proyecto = this.proyectos.find(
    p => p.id === this.proyectoIdSeleccionado
  );

  const formatearFecha = (f: any) => {
  if (!f) return '';
  return new Date(f).toISOString().split('T')[0];
};

  if (!proyecto) return;

  this.proyectoEditando = {
    ...proyecto,
    fechaInicio: formatearFecha(proyecto.fechaInicio),
  fechaFin: formatearFecha(proyecto.fechaFin)
  };

  this.mostrarModalProyecto = true;
}

guardarProyecto() {

  if (this.proyectoEditando?.id) {
   const payload = {
  ...this.proyectoEditando,
  fechaInicio: new Date(this.proyectoEditando.fechaInicio).toISOString(),
  fechaFin: new Date(this.proyectoEditando.fechaFin).toISOString()
};

this.ganttService.actualizarProyecto(payload)
  .subscribe(() => {
    this.mostrarModalProyecto = false;
    this.proyectoEditando = null;
    this.cargarProyectos();
    this.recargarTodo();
  });

  } else {

  const payload = {
  ...this.nuevoProyecto,
  obraId: Number(this.nuevoProyecto.obraId)
};

  const obraIdFinal = this.obraIdSeleccionada ?? this.nuevoProyecto.obraId;

if (!obraIdFinal) {
  alert("Seleccione una obra antes de crear el proyecto");
  return;
}

  this.ganttService.crearProyecto(payload)
    .subscribe(() => {
      this.mostrarModalProyecto = false;
      this.nuevoProyecto = {
        obraId: null,
        nombre: '',
        fechaInicio: '',
        fechaFin: ''
      };
      this.cargarProyectos();
    });
}
  this.recargarTodo();
}

detectarEscala(fechaMin: Date, fechaMax: Date){

  const dias =
    (fechaMax.getTime() - fechaMin.getTime())
    / (1000*60*60*24);

  if(dias <= 15)
    this.tipoEscala = 'dia';
  else if(dias <= 90)
    this.tipoEscala = 'semana';
  else
    this.tipoEscala = 'mes';
}

generarDias(inicio: Date, fin: Date){

  const dias:any[]=[];
  let actual = new Date(inicio);

  while(actual<=fin){
    dias.push(new Date(actual));
    actual.setDate(actual.getDate()+1);
  }

  return dias;
}

generarSemanas(inicio: Date, fin: Date){

  const semanas: Date[] = [];

  let actual = new Date(inicio);

  // 🔥 mover al lunes de esa semana
  const dia = actual.getDay(); // 0 domingo, 1 lunes...
  const diff = (dia === 0 ? -6 : 1 - dia);
  actual.setDate(actual.getDate() + diff);

  while(actual <= fin){
    semanas.push(new Date(actual));
    actual.setDate(actual.getDate() + 7);
  }

  return semanas;
}

generarMeses(inicio: Date, fin: Date){

  const meses:any[]=[];
  let actual = new Date(inicio);

  while(actual<=fin){
    meses.push(new Date(actual));
    actual.setMonth(actual.getMonth()+1);
  }

  return meses;
}

  cargarProyectos() {

  if (!this.obraIdSeleccionada) {
    this.proyectos = [];
    this.proyectoIdSeleccionado = null;
    return;
  }

  this.ganttService
    .getProyectos(this.obraIdSeleccionada)
    .subscribe(data => {
      this.proyectos = data;

      // 🔥 si el proyecto seleccionado ya no existe, reset
      if (!data.some(p => p.id === this.proyectoIdSeleccionado)) {
        this.proyectoIdSeleccionado = null;
      }
    });
}

cargarCurvaS() {

  this.ganttService.getGantt(this.obraIdSeleccionada ?? undefined)
    .subscribe(data => {

      if (this.proyectoIdSeleccionado) {
  data = data.filter(p => p.proyectoId === this.proyectoIdSeleccionado);
}

      if (!data.length) return;

// 🔥 SIEMPRE usar actividades (NO obra)

let fechaMin: Date | null = null;
let fechaMax: Date | null = null;

data.forEach(proyecto => {
  proyecto.actividades.forEach((act: ActividadGanttDto) => {

    const inicio = new Date(act.fechaInicio);
    const fin = new Date(act.fechaFin);

    if (!fechaMin || inicio < fechaMin) fechaMin = inicio;
    if (!fechaMax || fin > fechaMax) fechaMax = fin;

  });
});

// 🔥 seguridad extra
if (!fechaMin || !fechaMax) return;

this.detectarEscala(fechaMin, fechaMax);
// generar semanas del proyecto
let timeline: Date[] = [];

if (this.tipoEscala === 'dia')
  timeline = this.generarDias(fechaMin, fechaMax);

if (this.tipoEscala === 'semana')
  timeline = this.generarSemanas(fechaMin, fechaMax);

if (this.tipoEscala === 'mes')
  timeline = this.generarMeses(fechaMin, fechaMax);

      let planAcumulado: number[]=[];
      let realAcumulado: number[]=[];
      let ejecutadoGlobal = 0;

      const totalProyecto = data.reduce((sum, p) => 
        sum + p.actividades.reduce((s:number, a:ActividadGanttDto) => s + a.cantidadTotal, 0)
      , 0);

      timeline.forEach((slot, i) => {

        let planTotal = 0;
      let realTotal = 0;

  // 🔵 PLANIFICADO
  data.forEach(proyecto => {

    proyecto.actividades.forEach((act: ActividadGanttDto) => {

      const slotInicio = this.getSlotProyecto(
        new Date(act.fechaInicio),
        timeline
      );

      const slotFin = this.getSlotProyecto(
        new Date(act.fechaFin),
        timeline
      );

      const duracion = (slotFin - slotInicio) + 1;

      if (i < slotInicio) {
  // no ha empezado
}

else if (i >= slotInicio && i <= slotFin) {
  const progreso = (i - slotInicio + 1) / duracion;
  planTotal += act.cantidadTotal * progreso;
}

else if (i > slotFin) {
  // 🔥 YA TERMINÓ → suma completo
  planTotal += act.cantidadTotal;
}

    });

  });

  // 🟢 REAL
 

  let ejecutadoEnEsteSlot = 0;

data.forEach(proyecto => {
  proyecto.actividades.forEach((act: ActividadGanttDto) => {

    act.avances.forEach((a: any) => {

      if (a.numeroSemana === i + 1) {
        ejecutadoEnEsteSlot += a.cantidadEjecutada;
      }

    });

  });
});

  ejecutadoGlobal += ejecutadoEnEsteSlot;

  realAcumulado.push(
    (ejecutadoGlobal / totalProyecto) * 100
  );



let porcentaje = (planTotal / totalProyecto) * 100;

// 🔥 evitar que baje (curva siempre creciente)
if (i > 0 && porcentaje < planAcumulado[i - 1]) {
  porcentaje = planAcumulado[i - 1];
}

planAcumulado.push(porcentaje);

});
// 🔥 asegurar que el último punto sea 100%


    // ===============================
// 🔥 CALCULO FORECAST REAL
// ===============================

let forecast: (number | null)[] = [...realAcumulado];

// último valor real ejecutado
const ultimoRealForecast = Math.max(...realAcumulado);

// semana donde realmente hubo avance
let ultimaSemanaConAvance = -1;

for (let i = realAcumulado.length - 1; i >= 0; i--) {
  if (realAcumulado[i] > 0) {
    ultimaSemanaConAvance = i;
    break;
  }
}

// 👉 SI NO HAY AVANCES → NO FORECAST
if (ultimaSemanaConAvance === -1) {
  forecast = realAcumulado.map(() => null);
}
else {

  const semanasEjecutadas = ultimaSemanaConAvance + 1;

  const velocidadReal =
  ultimoRealForecast / semanasEjecutadas;

  let progreso = ultimoRealForecast;
  let semana = semanasEjecutadas;

  while (progreso < 100 && semana < timeline.length + 20) {

    progreso += velocidadReal;

    if (progreso > 100)
      progreso = 100;

    forecast.push(progreso);
    semana++;
  }
}

// ===============================
// 🔥 LABELS DINÁMICOS
// ===============================

const totalSemanas = forecast.length;

// extender plan y real hasta el tamaño del forecast
while (planAcumulado.length < totalSemanas)
  planAcumulado.push(null as any);

while (realAcumulado.length < totalSemanas)
  realAcumulado.push(null as any);

const labels = timeline.map((t,i)=>{

  if(this.tipoEscala==='dia')
    return `D${i+1}`;

  if(this.tipoEscala==='semana')
    return `S${i+1}`;

  return `${t.toLocaleString('default',{month:'short'})}`;
});
// ======================
// SPI DEL PROYECTO REAL
// ======================

let ultimoPlan = 0;
let ultimoReal = 0;

for (let i = planAcumulado.length - 1; i >= 0; i--) {

  if (
    planAcumulado[i] !== null &&
    realAcumulado[i] !== null
  ) {
    ultimoPlan = planAcumulado[i];
    ultimoReal = realAcumulado[i];
    break;
  }
}

let SPI = 1;

if (ultimoPlan > 0)
  SPI = ultimoReal / ultimoPlan;

this.spiProyecto = SPI;
this.spiProyectoPorcentaje = SPI * 100;

// 🔥 NOMBRE DEL PROYECTO
let nombreProyecto = 'General';

if (this.proyectoIdSeleccionado) {
  const p = this.proyectos.find(p => p.id === this.proyectoIdSeleccionado);
  if (p) nombreProyecto = p.nombre;
}

// ======================
// 🚨 ALERTAS AUTOMÁTICAS
// ======================

if (SPI >= 1) {
  this.alertaProyecto = {
    tipo: 'success',
    mensaje: `El proyecto "${nombreProyecto}" está adelantado`
  };
}
else if (SPI >= 0.9) {
  this.alertaProyecto = {
    tipo: 'warning',
    mensaje: `El proyecto "${nombreProyecto}" está en rango`
  };
}
else if (SPI >= 0.75) {
  this.alertaProyecto = {
    tipo: 'risk',
    mensaje: `El proyecto "${nombreProyecto}" presenta riesgo de atraso`
  };
}
else {
  this.alertaProyecto = {
    tipo: 'danger',
    mensaje: `El proyecto "${nombreProyecto}" está críticamente atrasado`
  };
}

// ======================
// 🚨 ALERTAS POR ACTIVIDAD
// ======================

this.alertasActividades = [];

const hoy = new Date();

// semana actual del proyecto
const slotActual =
  this.getSlotProyecto(hoy, timeline);

data.forEach(proyecto => {

  proyecto.actividades.forEach((act:ActividadGanttDto) => {

    const semanaInicio =
      this.getSemanaProyecto(act.fechaInicio, fechaMin!);

    const semanaFin =
      this.getSemanaProyecto(act.fechaFin, fechaMin!);

    const duracion =
      semanaFin - semanaInicio + 1;

    if (slotActual < semanaInicio) return;

    let planEsperado = 0;

    if (slotActual >= semanaFin)
      planEsperado = act.cantidadTotal;
    else
      planEsperado =
        (act.cantidadTotal / duracion) *
        (slotActual - semanaInicio + 1);

    const ejecutado =
      act.avances
        .filter(a => a.numeroSemana <= slotActual)
        .reduce((sum, a) => sum + a.cantidadEjecutada, 0);

    const atrasoCantidad = planEsperado - ejecutado;

    if (atrasoCantidad > 0) {

      const atrasoSemanas =
        Math.round(
          atrasoCantidad /
          (act.cantidadTotal / duracion)
        );

      if (atrasoSemanas >= 1) {
        this.alertasActividades.push(
          `⚠️ Actividad "${act.nombre}" atrasada ${atrasoSemanas} semanas`
        );
      }
    }
  });
});
      this.curvaSChartData = {
        labels: labels,
        datasets:[
            {
              label:'Planificado',
              data: planAcumulado,
              borderDash:[6,6],
              tension:0.4
            },
            {
              label:'Real',
              data: realAcumulado,
              tension:0.4
            },
            {
              label:'Pronóstico',
              data: forecast,
              borderColor:'#ff9800',
              backgroundColor:'#ff9800',
              borderWidth:4,
              pointRadius:4,
              tension:0,
              borderDash:[10,5]
            }
            ]
      };

          setTimeout(() => {
            this.curvaSCanvas?.update();

            setTimeout(() => {
              if (this.curvaSCanvas?.chart) {
                this.curvaSImage = this.curvaSCanvas.chart.toBase64Image();
                console.log('✅ Curva S capturada correctamente');
              }
            }, 150);
          }, 150);

      this.curvaSChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
          let value = context.raw;

          if (value === null) return '';

          return context.dataset.label + ': ' + value.toFixed(0) + '%';
        }
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: function(value: any) {
          return value + '%';
        }
      }
    }
  }
};

    });
}

getSlotProyecto(fecha: Date, timeline: Date[]): number {

  return timeline.findIndex(t =>
    fecha >= t &&
    (
      this.tipoEscala==='dia'
        ? fecha < new Date(t.getTime()+86400000)
        : this.tipoEscala==='semana'
          ? fecha < new Date(t.getTime()+7*86400000)
          : fecha.getMonth()===t.getMonth()
    )
  );
}

getSemanaProyecto(fecha: string | Date, fechaMin: Date): number {

  const f =
    typeof fecha === 'string'
      ? new Date(fecha)
      : fecha;

  const diff =
    f.getTime() - fechaMin.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1;
}

abrirEditarActividad(data: any) {

  this.cargarProyectos();

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    return new Date(fecha).toISOString().split('T')[0];
  };

  this.actividadEditando = {
    id: data.actividadId,
    proyectoGanttId: data.proyectoGanttId,
    nombre: data.nombreReal || data.label,
    fechaInicio: formatearFecha(data.fechaInicio),
    fechaFin: formatearFecha(data.fechaFin),
    tipoUnidad: data.tipoUnidad,
    cantidadTotal: data.cantidadTotal,
    precedenteId: data.precedenteId
    
  };

  // 🔥 FIX CLAVE
  if (!this.proyectos.some(p => p.id === data.proyectoGanttId)) {
    this.proyectos.push({
      id: data.proyectoGanttId,
      nombre: data.nombreProyecto || 'Proyecto',
      fechaInicio: data.proyectoFechaInicio,
      fechaFin: data.proyectoFechaFin
    });
  }

  this.fechaInicioProyecto = formatearFecha(data.proyectoFechaInicio);
  this.fechaFinProyecto = formatearFecha(data.proyectoFechaFin);

  this.cargarActividadesDelProyecto();

  this.mostrarModal = true;

  this.prepararSemanas(data.actividadId);
}


getSemanaDesdeFecha(fecha: string): number {
  const date = new Date(fecha);
  const mes = date.getMonth(); // 0 = enero
  const dia = date.getDate();

  const semanaDelMes = Math.ceil(dia / 7);

  return mes * 4 + semanaDelMes;
}

obtenerFechasObra() {

  if (!this.obras?.length) return;

  if(!this.obraIdSeleccionada){
    this.obraSeleccionada = null;
    this.timelineObra = [];
    return;
  }

  this.obraSeleccionada =
    this.obras.find(o => o.id === this.obraIdSeleccionada);

  if(!this.obraSeleccionada) return;

  const inicio = new Date(this.obraSeleccionada.fechaInicio);
  const fin = new Date(this.obraSeleccionada.fechaFin);

  this.timelineObra =
    this.generarDiasObra(inicio, fin);
}

generarDiasObra(inicio: Date, fin: Date){

  const dias: Date[] = [];
  let actual = new Date(inicio);

  while(actual <= fin){
    dias.push(new Date(actual));
    actual.setDate(actual.getDate() + 2); // 👈 cada 2 días
  }

  return dias;
}

onProyectoCambio() {
  this.cargarActividadesDelProyecto();
  this.recargarTodo();
}

cargarActividadesDelProyecto() {

  if (!this.obraIdSeleccionada || !this.proyectoIdSeleccionado) {
    this.actividadesDelProyecto = [];
    return;
  }

  this.ganttService.getGantt(this.obraIdSeleccionada)
    .subscribe(data => {

      const proyecto = data.find(
        p => p.proyectoId === this.proyectoIdSeleccionado
      );

      if (!proyecto) {
        this.actividadesDelProyecto = [];
        return;
      }

      // 🔥 AQUÍ ESTÁ LA MAGIA
      this.actividadesDelProyecto = proyecto.actividades.filter((act: any) => {

  const esEdicion = !!this.actividadEditando;

  // 🚫 excluir la misma en edición (por ID)
  if (esEdicion && act.id === this.actividadEditando.id) {
    return false;
  }

  // 🚫 excluir la misma en creación (por datos temporales)
  if (!esEdicion) {
    if (
      act.nombre === this.nuevaActividad.nombre &&
      act.fechaInicio === this.nuevaActividad.fechaInicio &&
      act.fechaFin === this.nuevaActividad.fechaFin
    ) {
      return false;
    }
  }

  const fechaRef = esEdicion
    ? new Date(this.actividadEditando.fechaInicio)
    : new Date(this.nuevaActividad.fechaInicio);

  if (!fechaRef || isNaN(fechaRef.getTime())) {
    return true;
  }

  const fechaAct = new Date(act.fechaInicio);

  return fechaAct < fechaRef;
});
    });
}


eliminarProyecto() {

  if (!this.proyectoIdSeleccionado) {
    alert("Selecciona un proyecto");
    return;
  }

  const confirmar = confirm("¿Seguro que quieres eliminar este proyecto?");

  if (!confirmar) return;

  this.ganttService.eliminarProyecto(this.proyectoIdSeleccionado)
    .subscribe(() => {

      alert("Proyecto eliminado correctamente");

      // 🔥 limpiar selección
      this.proyectoIdSeleccionado = null;

      // 🔥 recargar lista
      this.cargarProyectos();
      this.recargarTodo();
    });
}

guardarActividad() {

  const esEdicion = !!this.actividadEditando?.id;

  const payload = esEdicion
    ? this.actividadEditando
    : this.nuevaActividad;

  // validación de proyecto
  const proyecto = this.proyectos.find(
    p => p.id === payload.proyectoGanttId
  );

  if (proyecto) {

    const normalizar = (fecha: any) => {
      if (!fecha) return null;
      if (typeof fecha === 'string' && fecha.length === 10) {
        const [y, m, d] = fecha.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      const f = new Date(fecha);
      return new Date(f.getFullYear(), f.getMonth(), f.getDate());
    };

    const inicioProyecto = normalizar(proyecto.fechaInicio);
    const finProyecto = normalizar(proyecto.fechaFin);

    const inicioAct = normalizar(payload.fechaInicio);
    const finAct = normalizar(payload.fechaFin);

    if (!inicioAct || !finAct) {
      alert("⚠️ Fechas inválidas");
      return;
    }

    if (!inicioProyecto || !finProyecto) {
      console.warn("⚠️ Proyecto sin fechas:", proyecto);
      return;
    }

    if (inicioAct < inicioProyecto || finAct > finProyecto) {
      alert("⚠️ La actividad debe estar dentro del proyecto");
      return;
    }
  }
  const precedenteId = payload.precedenteId;

  if (precedenteId) {

    const actividadPrecedente = this.actividadesDelProyecto.find(
      a => a.id === precedenteId
    );

    if (actividadPrecedente) {

      const finPrecedente = new Date(actividadPrecedente.fechaFin);
      const inicioActual = new Date(payload.fechaInicio);

      if (finPrecedente >= inicioActual) {
        alert(`⚠️ La actividad precedente debe terminar antes de que esta inicie`);
        return;
      }
    }
  }

  // 🚨 FIX IMPORTANTE
  payload.proyectoGanttId = Number(payload.proyectoGanttId);

  if (esEdicion) {

    this.ganttService.actualizarActividad(payload)
      .subscribe(() => {
        alert("✅ Actividad actualizada correctamente");
        this.cerrarModal();
        this.recargarTodo();
      });

  } else {

    this.ganttService.crearActividad(payload)
      .subscribe(() => {
        alert("✅ Actividad creada correctamente");
        this.cerrarModal();
        this.recargarTodo();
      });

  }
}

recargarTodo() {
  this.cargarGanttConMeses();
  this.cargarCurvaAvance();
  this.cargarCurvaS();
}

actualizarTitulo() {
  if (!this.obraIdSeleccionada) {
    this.tituloPrincipal = 'Avance General de Actividades';
  } else {
    const obra = this.obras.find(o => o.id === this.obraIdSeleccionada);
    this.tituloPrincipal = obra
      ? `Avance de: ${obra.nombreObra}`
      : 'Avance de Actividades';
  }
}

cargarObras() {

  if (this.modoRestringido) return; // 🔥 NO TRAE LISTA

  this.ganttService.getObras().subscribe(data => {
    this.obras = data;

    // 👇 si ya había filtro seleccionado
    if (this.obraIdSeleccionada) {
      this.obtenerFechasObra();
    }
  });
}

obtenerPosicion(fecha:string, timeline:Date[]){

  const f = new Date(fecha);

  return timeline.findIndex(t =>
    f >= t &&
    (
      this.tipoEscala==='dia'
        ? f < new Date(t.getTime()+86400000)
        : this.tipoEscala==='semana'
          ? f < new Date(t.getTime()+7*86400000)
          : f.getMonth()===t.getMonth()
    )
  ) + 1;
}

toggleProyecto(idProyecto: string) {
  if (this.proyectosColapsados.has(idProyecto)) {
    this.proyectosColapsados.delete(idProyecto);
  } else {
    this.proyectosColapsados.add(idProyecto);
  }

  // 🔥 solo redibujar, no recargar data
  setTimeout(() => this.cargarGanttConMeses(), 0);
}

cargarGanttConMeses() {
  if (this.ganttSub) {
    this.ganttSub.unsubscribe();
  }
  
this.ganttService.getGantt(this.obraIdSeleccionada ?? undefined).subscribe({
    next: (data) => {

      const proyecto = data.find(p => p.proyectoId === this.proyectoIdSeleccionado);

      // 🔥 FILTRO REAL POR PROYECTO
if (this.proyectoIdSeleccionado && this.obraIdSeleccionada) {
  data = data.filter(p => p.proyectoId === this.proyectoIdSeleccionado);
}

    if(!data || data.length===0){
  this.ganttChartData={labels:[],datasets:[]};
  return;
}

if (data.length === 0) {
  this.ganttChartData = { labels: [], datasets: [] };
  return;
}

  let estructura: any = {};

if (this.obraIdSeleccionada) {

  // 🔥 SOLO PROYECTOS
  data.forEach((proyecto: any) => {

    const proyectoNombre = proyecto.nombreProyecto;

    if (!estructura[proyectoNombre]) {
      estructura[proyectoNombre] = {
        actividades: [],
        fechaInicio: proyecto.fechaInicio,
        fechaFin: proyecto.fechaFin
      };
    }

    estructura[proyectoNombre].actividades.push(...proyecto.actividades);
  });

} else {

  // 🔥 TODAS LAS OBRAS
  estructura = data.reduce((acc: any, proyecto: any) => {

    if (!proyecto.nombreObra) return acc;

    const obra = proyecto.nombreObra;

    if (!acc[obra]) acc[obra] = {};

    const proyectoNombre = proyecto.nombreProyecto;

    if (!acc[obra][proyectoNombre]) {
        acc[obra][proyectoNombre] = {
          actividades: [],
          fechaInicio: proyecto.fechaInicio,
          fechaFin: proyecto.fechaFin
        };
      }

      acc[obra][proyectoNombre].actividades.push(...proyecto.actividades);

    return acc;

  }, {});
}

    // 🔥 SI ESTAMOS EN TODAS LAS OBRAS → COLAPSAR TODO POR DEFECTO
    if (!this.obraIdSeleccionada && !this.yaInicializoColapso) {

  Object.keys(estructura).forEach(obra => {
    Object.keys(estructura[obra]).forEach(nombreProyecto => {

      const idUnicoProyecto = `${obra}__${nombreProyecto}`;
      this.proyectosColapsados.add(idUnicoProyecto);

    });
  });

  this.yaInicializoColapso = true;
}

          const datasets: any[] = [];
          const colores = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];

          let fechaMin: Date | null = null;
          let fechaMax: Date | null = null;

          data.forEach(proyecto => {

            // 🔥 USAR FECHAS DEL PROYECTO SIEMPRE
            const inicioProyecto = new Date(proyecto.fechaInicio);
            const finProyecto = new Date(proyecto.fechaFin);

            if (!fechaMin || inicioProyecto < fechaMin) fechaMin = inicioProyecto;
            if (!fechaMax || finProyecto > fechaMax) fechaMax = finProyecto;

            // 🔥 Y TAMBIÉN LAS ACTIVIDADES (si existen)
            proyecto.actividades.forEach((act: ActividadGanttDto) => {

              const inicio = new Date(act.fechaInicio);
              const fin = new Date(act.fechaFin);

              if (inicio < fechaMin!) fechaMin = inicio;
              if (fin > fechaMax!) fechaMax = fin;

            });
        });

      // ⚠️ seguridad
      if (!fechaMin || !fechaMax) return;

          this.detectarEscala(fechaMin,fechaMax);

          let timeline:any[]=[];

          if(this.tipoEscala==='dia')
            timeline=this.generarDias(fechaMin,fechaMax);

          if(this.tipoEscala==='semana')
            timeline=this.generarSemanas(fechaMin,fechaMax);

          if(this.tipoEscala==='mes')
            timeline=this.generarMeses(fechaMin,fechaMax);

          this.timelineGantt = timeline;

          const totalSlots = timeline.length;

          const labelsY: string[] = [];
          const mapaVisual: Record<string, string> = {};

        if (this.obraIdSeleccionada) {

  Object.keys(estructura).forEach(nombreProyecto => {

    const colapsado = this.proyectosColapsados.has(nombreProyecto);
    
    const icono = colapsado ? '▶' : '▼';
    const idProyecto = `PROY_${nombreProyecto}`;
    labelsY.push(idProyecto);
    const labelProyecto = `${icono} 📁 ${nombreProyecto}`;

    mapaVisual[idProyecto] = `${icono} 📁 ${nombreProyecto}`;

    const inicioProyecto = this.obtenerPosicion(
      estructura[nombreProyecto].fechaInicio,
      timeline
    );

    const finProyecto = this.obtenerPosicion(
      estructura[nombreProyecto].fechaFin,
      timeline
    );

    const totalProyecto = estructura[nombreProyecto].actividades
    .reduce((sum: number, a: any) => sum + a.cantidadTotal, 0);

    const ejecutadoProyecto = estructura[nombreProyecto].actividades
      .reduce((sum: number, a: any) => {
        const ejecutado = (a.avances || [])
          .reduce((s: number, av: any) => s + av.cantidadEjecutada, 0);
        return sum + ejecutado;
      }, 0);

     const porcentajeProyecto =
      totalProyecto > 0
        ? Math.min((ejecutadoProyecto / totalProyecto) * 100, 100)
        : 0;

        const idUnicoProyecto = nombreProyecto;
    datasets.push({
        label: labelProyecto,
        data: [{
          x: [inicioProyecto - 0.5, finProyecto + 0.5],
          y: idProyecto,

          idProyecto: idUnicoProyecto,

          // 🔥 NUEVO
          porcentajeTotal: 100,
          porcentajeReal: porcentajeProyecto,
          fechaInicio: estructura[nombreProyecto].fechaInicio,
          fechaFin: estructura[nombreProyecto].fechaFin
        }],
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      maxBarThickness: 45
    });

    if (!colapsado) {
    estructura[nombreProyecto].actividades.forEach((act: ActividadGanttDto) => {

      const idUnico = `${nombreProyecto}__${act.id}`;

      labelsY.push(idUnico);

      mapaVisual[idUnico] = `└ ${act.nombre}`;

      const inicio = this.obtenerPosicion(act.fechaInicio, timeline);
      const fin = this.obtenerPosicion(act.fechaFin, timeline);

      datasets.push({
        label: act.nombre,
        data: [{
          x: [inicio - 0.5, fin + 0.5],
          y: idUnico,
          nombreReal: act.nombre,
          actividadId: act.id,
          proyectoGanttId: act.proyectoGanttId,
          nombreProyecto: nombreProyecto,
          tipoUnidad: act.tipoUnidad,
          precedenteId: act.precedenteId,
          proyectoFechaInicio: estructura[nombreProyecto].fechaInicio,
          proyectoFechaFin: estructura[nombreProyecto].fechaFin,
          cantidadTotal: act.cantidadTotal,
          fechaInicio: act.fechaInicio,
          fechaFin: act.fechaFin,
          porcentajeTotal: act.porcentajeAvance,
          
        }],
        backgroundColor: '#0d6efd',
        borderRadius: 6,
        maxBarThickness: 35
      });

     });
    }

  });

} else {

  Object.keys(estructura).forEach(obra => {

    const labelObra = `🏗 Obra: ${obra}`;
    labelsY.push(labelObra);

    Object.keys(estructura[obra]).forEach(nombreProyecto => {

      const idUnicoProyecto = `${obra}__${nombreProyecto}`;
      const colapsado = this.proyectosColapsados.has(idUnicoProyecto);

      const icono = colapsado ? '▶' : '▼';
      const labelProyecto = `   ${icono} 📁 ${nombreProyecto}`;

      labelsY.push(labelProyecto);

      const inicioProyecto = this.obtenerPosicion(
          estructura[obra][nombreProyecto].fechaInicio,
          timeline
        );

        const finProyecto = this.obtenerPosicion(
          estructura[obra][nombreProyecto].fechaFin,
          timeline
        );

      const actividades = estructura[obra][nombreProyecto].actividades;

      // 🔥 calcular igual que en el otro bloque
      const totalProyecto = actividades
        .reduce((sum: number, a: any) => sum + a.cantidadTotal, 0);

      const ejecutadoProyecto = actividades
        .reduce((sum: number, a: any) => {
          const ejecutado = (a.avances || [])
            .reduce((s: number, av: any) => s + av.cantidadEjecutada, 0);
          return sum + ejecutado;
        }, 0);

      const porcentajeProyecto =
        totalProyecto > 0
          ? Math.min((ejecutadoProyecto / totalProyecto) * 100, 100)
          : 0;

      datasets.push({
        label: labelProyecto,
        data: [{
          x: [inicioProyecto - 0.5, finProyecto + 0.5],
          y: labelProyecto,
          idProyecto: idUnicoProyecto,

          // 🔥 AQUÍ ESTÁ LA CLAVE
          fechaInicio: estructura[obra][nombreProyecto].fechaInicio,
          fechaFin: estructura[obra][nombreProyecto].fechaFin,
          porcentajeTotal: 100,
          porcentajeReal: porcentajeProyecto
        }],
        backgroundColor: porcentajeProyecto < 100 ? '#ffc107' : '#198754',
        borderWidth: 1,
        maxBarThickness: 45
      });

      if (!colapsado) {

      estructura[obra][nombreProyecto].actividades.forEach((act: ActividadGanttDto) => {

        const idUnico = `${nombreProyecto}__${act.id}`;

        labelsY.push(idUnico);

        mapaVisual[idUnico] = `└ ${act.nombre}`;

        const inicio = this.obtenerPosicion(act.fechaInicio, timeline);
        const fin = this.obtenerPosicion(act.fechaFin, timeline);

        datasets.push({
          label: act.nombre,
          data: [{
            x: [inicio - 0.5, fin + 0.5],
            y: idUnico,
            nombreReal: act.nombre,
            actividadId: act.id,
            proyectoGanttId: act.proyectoGanttId,
            nombreProyecto: nombreProyecto,
            tipoUnidad: act.tipoUnidad,
            precedenteId: act.precedenteId,
            proyectoFechaInicio: estructura[obra][nombreProyecto].fechaInicio,
            proyectoFechaFin: estructura[obra][nombreProyecto].fechaFin,
            cantidadTotal: act.cantidadTotal,
            fechaInicio: act.fechaInicio,
            fechaFin: act.fechaFin,
            porcentajeTotal: act.porcentajeAvance,
          }],
          backgroundColor: '#0d6efd',
          borderRadius: 6,
          maxBarThickness: 35
        });

      });

    }

    });

  });

}
if (this.chart?.chart) {
  this.chart.chart.data.labels = [];
  this.chart.chart.data.datasets = [];
  this.chart.chart.update();
}

this.mapaVisual = mapaVisual;

          this.ganttChartData = {
          labels: labelsY,
            datasets
          };
          const alturaPorActividad = 35; // px por fila
          const alturaHeader = 80;

          const totalAltura = labelsY.length * alturaPorActividad + alturaHeader;

          setTimeout(() => {
            const container = document.querySelector('.gantt-container') as HTMLElement;
            if (container) {
              container.style.height = totalAltura + 'px';
            }
          });

              this.ganttChartOptions = {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                parsing: {
                  xAxisKey: 'x',
                  yAxisKey: 'y'
                },
                plugins: {
        tooltip: {
          enabled: false, // ❌ desactiva el tooltip de Chart.js
          external: this.customTooltip.bind(this) // 🔥 usa el nuestro
        },
        legend: {
          display: false
        }
      },
            layout: {
        padding: {
          top: 80  
        }
      },

            scales: {
              x: {
                stacked: false,
                type: 'linear',
                min: 0.5,
                max: totalSlots + 0.5,
                title: {
                  display: false
                },
                ticks: {
              display: true,
              stepSize: 1,
              callback: (value) => {

                const timeline = this.timelineGantt;
                if (!timeline || timeline.length === 0) return '';

                const slot = Math.round(Number(value)) - 1;
                const fecha = timeline[slot];

                if (!fecha) return '';

                switch(this.tipoEscala) {

                  case 'dia':
                    return `${fecha.getDate()}`;

                  case 'semana':

                    const inicio = new Date(fecha);
                    const fin = new Date(fecha);
                    fin.setDate(fin.getDate() + 6);

                    const formatear = (f: Date) =>
                      `${f.getDate()} ${f.toLocaleString('default',{month:'short'})}`;

                    return `${formatear(inicio)} - ${formatear(fin)}`;

                  case 'mes':
                    return fecha.toLocaleString('default', { month: 'short' });

                  default:
                    return '';
                }
              }
            },
                grid: {
        display: true,
        drawTicks: false, // 🔥 mejor visual
        offset:false,

        lineWidth: (context: any) => {
          const v = Math.round(Number(context.tick.value));
          return v % 4 === 1 ? 2 : 1;
        },
        color: (context: any) => {
          const value = context.tick.value;
          return value % 4 === 1 ? '#000' : '#ddd';
        }
      }
              },

              y: {
  type: 'category',
  stacked: true,
  offset: true,
  labels: labelsY,
  ticks: {
  callback: (value: any, index: number) => {

  const labelReal = this.ganttChartData.labels?.[index] as string;

  return this.mapaVisual[labelReal] || labelReal;
}
},
        grid: {
          display: true,
          drawTicks: true,
          color: '#ddd',
          lineWidth: 1
      }
      }
            },
          };

          setTimeout(() => this.chart?.update('none'), 100);
        },error: (err) => {
      console.error("❌ ERROR COMPLETO:", err);
    }
  });
}

customTooltip(context: any) {

  let tooltipEl = document.getElementById('gantt-tooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'gantt-tooltip';

    tooltipEl.style.position = 'absolute';
    tooltipEl.style.background = '#000';
    tooltipEl.style.color = '#fff';
    tooltipEl.style.padding = '10px 12px';
    tooltipEl.style.borderRadius = '8px';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.zIndex = '9999';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
    tooltipEl.style.transition = 'all 0.1s ease';

    document.body.appendChild(tooltipEl);
  }

  const tooltipModel = context.tooltip;

  if (tooltipModel.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataPoint = tooltipModel.dataPoints[0];
  const raw = dataPoint.raw || dataPoint.dataset.data[dataPoint.dataIndex];
  const label = raw?.nombreReal || dataPoint.dataset.label.replace('_base', '');
  const datasetLabel = dataPoint.dataset.label;

  // 🚫 ocultar tooltip de la base si existe avance
  
  const formatFecha = (f: any) => {
  if (!f) return 'N/A';
  const fecha = f instanceof Date ? f : new Date(f);
  return isNaN(fecha.getTime()) ? 'N/A' : fecha.toLocaleDateString();
};
  

  let html = `<div style="font-weight:600; margin-bottom:4px;">${label}</div>`;

    html += `
      <div>📅 Desde: ${formatFecha(raw.fechaInicio)}</div>
      <div>📅 Hasta: ${formatFecha(raw.fechaFin)}</div>
      <div>📊 Total: ${(raw?.porcentajeTotal ?? 0).toFixed(1)}%</div>
      <div>📈 Avance real: ${(raw?.porcentajeReal ?? 0).toFixed(1)}%</div>
    `;

  tooltipEl.innerHTML = html;

  const position = context.chart.canvas.getBoundingClientRect();

  tooltipEl.style.opacity = '1';
const tooltipWidth = tooltipEl.offsetWidth;
const windowWidth = window.innerWidth;

let left = position.left + window.pageXOffset + tooltipModel.caretX + 10;

// 🔥 si se sale por la derecha, lo mandamos a la izquierda
if (left + tooltipWidth > windowWidth) {
  left = position.left + window.pageXOffset + tooltipModel.caretX - tooltipWidth - 10;
}

tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 10 + 'px';
} 



mesesSemanasPlugin = {
  id: 'mesesSemanas',

  afterDatasetsDraw: (chart:any)=>{

    if (chart.config.options?.indexAxis !== 'y')
      return;

    const timeline = this.timelineGantt;
    if (!timeline?.length) return;

    const ctx = chart.ctx;
    const xAxis = chart.scales['x'];

    const headerMesHeight = 25;
    const headerSemanaHeight = 20;

    const topMes = chart.chartArea.top - headerMesHeight - headerSemanaHeight;
    const topSemana = chart.chartArea.top - headerSemanaHeight;

    ctx.save();
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    let ultimoMes = -1;
    let inicioMesSlot = 1;

    // =========================
    // 🔵 DIBUJAR MESES
    // =========================
    timeline.forEach((fecha, i) => {

      const mesActual = fecha.getMonth();

      if (mesActual !== ultimoMes) {

        if (i > 0) {

          const xStart = xAxis.getPixelForValue(inicioMesSlot - 0.5);
          const xEnd = xAxis.getPixelForValue(i + 0.5);

          const width = xEnd - xStart;

          ctx.strokeRect(xStart, topMes, width, headerMesHeight);

          ctx.fillText(
            timeline[i - 1].toLocaleString('default',{month:'long'}),
            xStart + width / 2,
            topMes + 15
          );
        }

        inicioMesSlot = i + 1;
        ultimoMes = mesActual;
      }
    });

    // último mes
    const xStart = xAxis.getPixelForValue(inicioMesSlot - 0.5);
    const xEnd = xAxis.getPixelForValue(timeline.length + 0.5);

    const width = xEnd - xStart;

    ctx.strokeRect(xStart, topMes, width, headerMesHeight);

    ctx.fillText(
      timeline[timeline.length - 1]
        .toLocaleString('default',{month:'long'}),
      xStart + width / 2,
      topMes + 15
    );

    // =========================
    // 🟢 DIBUJAR SEMANAS POR MES
    // =========================
ctx.font = '10px Arial';

let semanaActual = -1;
let inicioSemanaSlot = 1;

timeline.forEach((fecha, i) => {

  const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);

  const diffDias =
    (fecha.getTime() - inicioMes.getTime()) / (1000 * 60 * 60 * 24);

  const semanaDelMes = Math.floor(diffDias / 7) + 1;

  // 🔥 cuando cambia la semana → dibuja bloque anterior
  if (semanaDelMes !== semanaActual) {

   if (i > 0) {

  const xStartSemana = xAxis.getPixelForValue(inicioSemanaSlot - 0.5);
  const xEndSemana = xAxis.getPixelForValue(i + 0.5);

  const widthSemana = xEndSemana - xStartSemana;

  ctx.strokeRect(xStartSemana, topSemana, widthSemana, headerSemanaHeight);

  ctx.fillText(
    `S${semanaActual}`,
    xStartSemana + widthSemana / 2,
    topSemana + 13
  );
}

    inicioSemanaSlot = i + 1;
    semanaActual = semanaDelMes;
  }

});

// 🔥 última semana
const xStartSemana = xAxis.getPixelForValue(inicioSemanaSlot - 0.5);
const xEndSemana = xAxis.getPixelForValue(timeline.length + 0.5);

const widthSemana = xEndSemana - xStartSemana;

ctx.strokeRect(xStartSemana, topSemana, widthSemana, headerSemanaHeight);

ctx.fillText(
  `S${semanaActual}`,
  xStartSemana + widthSemana / 2,
  topSemana + 13
);

    ctx.restore();
  }
};


  cargarCurvaAvance() {
  this.ganttService.getGantt(this.obraIdSeleccionada ?? undefined)
    .subscribe(data => {

      if (this.proyectoIdSeleccionado) {
  data = data.filter(p => p.proyectoId === this.proyectoIdSeleccionado);
} 

      const datasets: any[] = [];

      if (!data || data.length === 0) {
        this.lineChartData = { labels: [], datasets: [] };
        return;
      }

      // 🔥 SI NO HAY AVANCES → crear semanas por defecto
      let todasLasSemanas: number[] = [];

data.forEach(proyecto => {
  proyecto.actividades.forEach((act: any) => {
    act.avances.forEach((a: any) => {
      if (!todasLasSemanas.includes(a.numeroSemana)) {
        todasLasSemanas.push(a.numeroSemana);
      }
    });
  });
});

if (todasLasSemanas.length === 0) {
  todasLasSemanas = [1];
}

todasLasSemanas.sort((a, b) => a - b);

     let act: any = null;

    data.forEach(proyecto => {
      const encontrada = proyecto.actividades.find(
        (a: any) => a.id === this.actividadSeleccionadaId
      );

      if (encontrada) {
        act = encontrada;
      }
    });

      // 🔥 SI NO HAY SEMANAS → crear mínimo 1
      if (todasLasSemanas.length === 0) {
        todasLasSemanas = [1];
      }

      todasLasSemanas.sort((a, b) => a - b);

     data.forEach(proyecto => {

      proyecto.actividades.forEach((act: any) => {

        let acumulado = 0;

        const avancesOrdenados = [...(act.avances || [])]
          .sort((a, b) => a.numeroSemana - b.numeroSemana);

        const valores = todasLasSemanas.map(semana => {

          const avance = avancesOrdenados.find(
            a => a.numeroSemana === semana
          );

          if (avance) {
            acumulado += avance.cantidadEjecutada;
          }

          const porcentaje = act.cantidadTotal > 0
            ? (acumulado / act.cantidadTotal) * 100
            : 0;

          return porcentaje;
        });

        datasets.push({
          data: valores,
          label: act.nombre,
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          tipoUnidad: act.tipoUnidad
        });

      });

    });

      this.lineChartData = {
        labels: todasLasSemanas.map(s => `S${s}`),
        datasets: datasets
      };

      // 🔥 FORZAR REDIBUJO (CLAVE)
      setTimeout(() => {
        this.chart?.update();
      }, 100);
    });
}

abrirModal() {

  if (!this.proyectoIdSeleccionado) {
    alert("Seleccione una actividad primero");
    return;
  }

  const proyecto = this.proyectos.find(
    p => p.id === this.proyectoIdSeleccionado
  );

  if (proyecto) {
    this.fechaInicioProyecto = new Date(proyecto.fechaInicio)
      .toISOString().split('T')[0];

    this.fechaFinProyecto = new Date(proyecto.fechaFin)
      .toISOString().split('T')[0];
  }

  this.actividadEditando = null;
  this.actividadSeleccionadaId = null;

  this.nuevaActividad.proyectoGanttId = this.proyectoIdSeleccionado;
  console.log("🧠 PROYECTO AL ABRIR MODAL:", this.nuevaActividad.proyectoGanttId);

  this.cargarActividadesDelProyecto();

  this.mostrarModal = true;
}

cerrarModal() {
  this.mostrarModal = false;

  this.actividadEditando = null;
  this.actividadSeleccionadaId = null;

  this.nuevaActividad = {
    proyectoGanttId: null, // 🔥 ESTE ES EL FIX
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    tipoUnidad: 'MTS',
    cantidadTotal: 0,
    precedenteId: null
  };
}

onChartClick(event: any) {

  const elements = event.active;
  if (!elements || elements.length === 0) return;

  const first = elements[0];

  const datasetIndex = first.datasetIndex;
  const index = first.index;

  const dataset: any = this.ganttChartData.datasets[datasetIndex];
  const raw = dataset.data[index];
  const datasetLabel = dataset.label;

  // 🚫 IGNORAR BASE
  if (datasetLabel.includes('_base')) return;

    if (raw?.idProyecto) {
      this.toggleProyecto(raw.idProyecto);
      return;
    }

  if (raw?.actividadId) {

    this.actividadSeleccionadaId = raw.actividadId;

    this.abrirEditarActividad({
      ...raw,
      label: dataset.label
    });

    this.cargarGanttConMeses();
  }
}

eliminarActividad() {

  if (!this.actividadEditando?.id) return;

  const confirmar = confirm('¿Seguro que quieres eliminar esta actividad?');

  if (!confirmar) return;

  this.ganttService.eliminarActividad(this.actividadEditando.id)
    .subscribe(() => {
      alert("Actividad eliminada exitosamente");
      this.cerrarModal();

      // limpiar selección
      this.actividadSeleccionadaId = null;

      this.recargarTodo();
    });
}

registrarAvanceAdmin() {

  if (!this.actividadEditando?.id) {
    return;
  }

  const fechaInicioActividad = new Date(this.actividadEditando.fechaInicio);

  const inicioSemana = new Date(fechaInicioActividad);
  inicioSemana.setDate(
    inicioSemana.getDate() + (this.actividadEditando.semanaSeleccionada - 1) * 7
  );

  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 6);

  const payload = {
    actividadGanttId: this.actividadEditando.id,
    numeroSemana: this.actividadEditando.semanaSeleccionada,
    fechaInicioSemana: inicioSemana,
    fechaFinSemana: finSemana,
    cantidadEjecutada: this.actividadEditando.nuevoAvance,
  };

  this.ganttService.registrarAvance(payload)
    .subscribe({
      next: (res) => {
       alert("Avance registrado exitosamente");
        this.cargarGanttConMeses();
        this.cargarCurvaAvance();
        this.cargarCurvaS();
      },
     error: (err) => {
  const mensaje = err.error?.mensaje || "Error inesperado";
  alert(mensaje);
}
    });
}

prepararSemanas(actividadId: number) {

  this.ganttService.getGantt(this.obraIdSeleccionada ?? undefined)
    .subscribe(data => {

      let act: any = null;
      let proyecto: any = null;

      // 🔥 buscar actividad y su proyecto
      data.forEach(p => {
        const encontrada = p.actividades.find(
          (a: any) => a.id === actividadId
        );

        if (encontrada) {
          act = encontrada;
          proyecto = p;
        }
      });

      if (!act || !proyecto) return;

      // 🔥 fecha inicio del PROYECTO (clave)
      const fechaInicioProyecto = new Date(proyecto.fechaInicio);

      // 🔥 calcular semanas reales dentro del proyecto
      const semanaInicio = this.getSemanaProyecto(
        act.fechaInicio,
        fechaInicioProyecto
      );

      const semanaFin = this.getSemanaProyecto(
        act.fechaFin,
        fechaInicioProyecto
      );

      const totalSemanasActividad = semanaFin - semanaInicio + 1;

      // 🔥 semanas que ya tienen avance
      const semanasRegistradas = act.avances.map((a: any) => a.numeroSemana);

      // 🔥 generar semanas REALES del proyecto
      const todas = Array.from(
        { length: totalSemanasActividad },
        (_, i) => semanaInicio + i
      );

      // 🔥 filtrar disponibles
      const disponibles = todas.filter(
        w => !semanasRegistradas.includes(w)
      );

      this.actividadEditando.semanasDisponibles = disponibles;
      this.actividadEditando.semanaSeleccionada = disponibles[0];
    });
}
}