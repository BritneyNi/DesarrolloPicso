export interface AvanceDto {
  numeroSemana: number;
  cantidadEjecutada: number;
  fechaInicioSemana: string;
  fechaFinSemana: string;
}

export interface ActividadGanttDto {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  pesoProyecto: number;
  cantidadTotal:number;
  tipoUnidad: string;
  porcentajeAvance: number;
  proyectoGanttId: number;
  avances: AvanceDto[];
  precedenteId?: number | null;
}

export interface ProyectoGanttDto {
  proyectoId: number;
  nombreProyecto: string;
  nombreObra: string;
  fechaInicio: string;
  fechaFin: string;
  porcentajeProyecto: number;
  actividades: ActividadGanttDto[];
}