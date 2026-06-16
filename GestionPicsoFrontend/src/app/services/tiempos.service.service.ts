import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { environment } from '../../environments/environments';

export interface Tiempo {
  id?: number;
  empleadoId: number;
  fechaHoraEntrada?: string | null;
  fechaHoraSalida?: string | null;
  ubicacion?: string;
  comentarios: string;
  permisosEspeciales: string;
  nombreEmpleado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TiemposService {
  private apiIngresos = `${environment.apiUrl}/IngresosPersonal`;
  private apiSalidas  = `${environment.apiUrl}/SalidasPersonal`;

  constructor(private http: HttpClient) {}

  obtenerIngresos(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiIngresos).pipe(
      catchError(err => throwError(() => err))
    );
  }

  obtenerIngresoPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
    return this.http
      .get<Tiempo[]>(`${this.apiIngresos}?empleadoId=${empleadoId}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  obtenerUltimoIngresoPorEmpleado(empleadoId: number): Observable<Tiempo> {
    return this.http
      .get<Tiempo>(`${this.apiIngresos}/ultimo/${empleadoId}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  registrarIngreso(tiempo: Tiempo): Observable<any> {
    return this.http.post(this.apiIngresos, tiempo).pipe(
      catchError(err => throwError(() => err))
    );
  }

 /*registrarIngresoAdicional(tiempo: Tiempo): Observable<any> {
  return this.http.post(`${this.apiIngresos}/adicional`, tiempo, { observe: 'response' }).pipe(
    catchError(err => {
      console.error('❌ Error en registrarIngresoAdicional', err);
      return of(err); // evita que forkJoin falle
    })
  );
}*/

  actualizarIngreso(id: number, tiempo: Tiempo): Observable<void> {
    return this.http.put<void>(`${this.apiIngresos}/${id}`, tiempo).pipe(
      catchError(err => {
        console.error('❌ Error actualizando ingreso:', err);
        return throwError(() => err);
      })
    );
  }

  eliminarIngreso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiIngresos}/${id}`).pipe(
      catchError(err => throwError(() => err))
    );
  }

  eliminarSalida(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiSalidas}/${id}`).pipe(
    catchError(err => throwError(() => err))
  );
}

  obtenerSalidas(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiSalidas).pipe(
      catchError(err => throwError(() => err))
    );
  }

  obtenerSalidaPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
    return this.http
      .get<Tiempo[]>(`${this.apiSalidas}?empleadoId=${empleadoId}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  obtenerUltimaSalidaPorEmpleado(empleadoId: number): Observable<Tiempo> {
    return this.http
      .get<Tiempo>(`${this.apiSalidas}/ultimo/${empleadoId}`)
      .pipe(catchError(err => throwError(() => err)));
  }

  registrarSalida(tiempo: Tiempo): Observable<any> {
    return this.http.post(this.apiSalidas, tiempo).pipe(
      catchError(err => throwError(() => err))
    );
  }

/* registrarSalidaAdicional(tiempo: Tiempo): Observable<any> {
  return this.http.post(`${this.apiSalidas}/adicional`, tiempo, { observe: 'response' }).pipe(
    catchError(err => {
      console.error('❌ Error en registrarSalidaAdicional', err);
      return of(err);
    })
  );
}*/

  actualizarSalida(id: number, tiempo: Tiempo): Observable<void> {
    return this.http.put<void>(`${this.apiSalidas}/${id}`, tiempo).pipe(
      catchError(err => {
        console.error('❌ Error actualizando salida:', err);
        return throwError(() => err);
      })
    );
  }

  obtenerTiempos(): Observable<Tiempo[]> {
    return this.http.get<Tiempo[]>(this.apiIngresos).pipe(
      catchError(err => throwError(() => err))
    );
  }
  
obtenerIngresosPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
  return this.http.get<Tiempo[]>(`${this.apiIngresos}/empleado/${empleadoId}`);
}

obtenerSalidasPorEmpleado(empleadoId: number): Observable<Tiempo[]> {
  return this.http.get<Tiempo[]>(`${this.apiSalidas}/empleado/${empleadoId}`);
}

}
