import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { tap } from 'rxjs';
import { NotificacionesService } from './notificaciones.service';

export interface Empleado {
  id: number;
  cedula: string;
  nombreCompleto: string;
  cargo: string;
  obra: string;
  responsable: string | null;
  responsableSecundario: string | null;
  salario?: number | null;
  bono?: string | null;
  estado: string;
  telefono?: string | null;
  fechaNacimiento?: Date | string | null;
  aptitudEnAltura?: Date | string | null;
  vencimientoAptitudAlturas?: Date | null;
  numeroCuenta?: string | null;
  examenIngreso?: Date | string | null;
  fechaInicioContrato: Date | string | null;
  tipoContrato?: string | null;
  firmoContrato?: string | null;
  seleccionado?: boolean;
  fechaHoraEntrada?: string | null;
  fechaHoraSalida?: string | null;
  ubicacion?: string | null;
  direccion?: string | null;
  estadoTemporario?: string;
  fondoPension?: string | null;
  eps?: string | null;
  arl?: string | null;
  ccf?: string | null;
  fechaRetiro?: string | Date | null;
  pagoLiquidacion?: string | null;
  correo?: string | null;
  telefonoEmergencia?: number | null;
  fechaReentrenamiento?: Date | null;
  observacion?: string | null;
  aptitudArchivo?: string | null;
  aptitudArchivoSas?: string | null;
  turno?: string | null;
  horaIngresoManual?: string;
  horaSalidaManual?: string;
  mensajeIngreso?: string;
  mensajeSalida?: string;
}

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private apiUrl = `${environment.apiUrl}/Empleados`;

  constructor(private http: HttpClient, private noti: NotificacionesService) {}

  obtenerEmpleados(page: number = 1, pageSize: number = 500): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }

  obtenerEmpleadosPorObraYResponsable(obra: string, responsable: string): Observable<Empleado[]> {
    return new Observable(observer => {
      this.obtenerEmpleados().subscribe(empleados => {
        const filtrados = empleados.filter(emp =>
          emp.obra.trim().toLowerCase() === obra.trim().toLowerCase()
        );
        observer.next(filtrados);
        observer.complete();
      });
    });
  }

  crearEmpleado(empleado: Empleado): Observable<Empleado> {
    if (empleado.salario === '' as any) empleado.salario = null;
    return this.http.post<Empleado>(this.apiUrl, empleado)
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  actualizarEmpleado(id: number, empleado: Empleado): Observable<Empleado> {
    if (empleado.salario === '' as any) empleado.salario = null;
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, empleado)
      .pipe(tap(() => this.noti.triggerVerificacion()));
  }

  obtenerObras(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/obras`);
  }

  obtenerUbicaciones(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/ubicaciones`);
  }

  subirAptitudArchivo(id: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post(`${this.apiUrl}/${id}/aptitudArchivo`, formData);
  }

  obtenerArchivoSas(id: number): Observable<{ urlSas: string }> {
    return this.http.get<{ urlSas: string }>(`${this.apiUrl}/${id}/aptitudArchivo`);
  }

  descargarContratoPdf(id: number) {
    return this.http.get(
      `${this.apiUrl}/${id}/contrato-pdf`,
      { responseType: 'blob' }
    );
  }
  exportarExcel(filtros: any, columnas: string[]): Observable<Blob> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.ubicacion) params.set('ubicacion', filtros.ubicacion);
  if (filtros.tipoContrato) params.set('tipoContrato', filtros.tipoContrato);
  if (filtros.firmoContrato) params.set('firmoContrato', filtros.firmoContrato);
  params.set('columnas', columnas.join(','));
  return this.http.get(`${this.apiUrl}/exportar-excel?${params.toString()}`, { responseType: 'blob' });
}
}