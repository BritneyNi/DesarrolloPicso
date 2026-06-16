import { Injectable, inject } from '@angular/core';
import { ObraService, Obra } from './obras.service';
import { map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class MetricService {

    private http = inject(HttpClient);
    private obraService = inject(ObraService);
    private apiUrl = `${environment.apiUrl}/Metric`;

  // ⭐ traer todas las obras (activas + inactivas)
  getAllObras(): Observable<Obra[]> {
    return this.obraService.getObras().pipe(
      map(activas => activas || [])
    );
  }

  // ⭐ filtro temporal global
  filtrarPorFecha(obras: Obra[], desde?: Date, hasta?: Date): Obra[] {
    if (!desde && !hasta) return obras;

    return obras.filter(o => {
      if (!o.fechaCreacion) return false;

      const fecha = new Date(o.fechaCreacion);

      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      return true;
    });
  }

  // ⭐ dataset grafica costo por m2
 getCostoPorMetroDataset(obras: Obra[]) {
  return obras.map(o => ({
    nombre: o.nombreObra ?? '',
    costoPorMetro: (o.tamano ?? 0) > 0 ? (o.costoObra ?? 0) / (o.tamano ?? 0) : 0,
    costo: o.costoObra ?? 0,
    tamano: o.tamano ?? 0
  }));
}

getPersonalPorObra() {
  return this.http.get<any[]>(`${environment.apiUrl}/Obras/dashboard/personal-obra`);
}

getPersonalPorCiudad() {
  return this.http.get<any[]>(`${environment.apiUrl}/Obras/dashboard/personal-ciudad`);
}

getResumenObra(){
  return this.http.get<any[]>(`${environment.apiUrl}/Obras/dashboard/obra-resumen`);
}
getSalarioCiudad(){
  return this.http.get<any[]>(`${environment.apiUrl}/Obras/dashboard/salario-ciudad`);
}


getPersonalPorObraRango(desde: Date, hasta: Date) {
  return this.http.get<any[]>(
    `${environment.apiUrl}/Obras/dashboard/personal-obra-rango?fechaInicio=${desde.toISOString()}&fechaFin=${hasta.toISOString()}`
  );
}

getPersonalPorCiudadRango(desde: Date, hasta: Date) {
  return this.http.get<any[]>(
    `${environment.apiUrl}/Obras/dashboard/personal-ciudad-rango?fechaInicio=${desde.toISOString()}&fechaFin=${hasta.toISOString()}`
  );
}

getResumenObraRango(desde: Date, hasta: Date) {
  return this.http.get<any[]>(
    `${environment.apiUrl}/Obras/dashboard/obra-resumen-rango?fechaInicio=${desde.toISOString()}&fechaFin=${hasta.toISOString()}`
  );
}

private formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

getSalarioCiudadRango(desde: Date, hasta: Date) {
  return this.http.get<any[]>(
    `${environment.apiUrl}/Obras/dashboard/salario-ciudad-rango?fechaInicio=${this.formatDate(desde)}&fechaFin=${this.formatDate(hasta)}`
  );
}


}