import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NominaLockService {

  private readonly DIAS_DE_CIERRE = [12, 27];
  private readonly HORA_BLOQUEO = 8;

  readonly MENSAJE_BLOQUEO =
    'Los horarios de fechas anteriores se encuentran bloqueados después del ' +
    'corte de nómina. Comuníquese con Recursos Humanos.';

  estaBloquada(fechaObjetivo: string | Date): boolean {
    const objetivo = this.soloDia(new Date(fechaObjetivo));
    const ahoraCo  = this.ahoraColombia();
    const hoyCo    = this.soloDia(ahoraCo);

    // Fecha de hoy o futura → siempre permitida
    if (objetivo >= hoyCo) return false;

    // Solo bloquear si HOY es exactamente día 12 o día 27
    const diaCo = ahoraCo.getDate();
    if (!this.DIAS_DE_CIERRE.includes(diaCo)) return false;

    // Es día de cierre → bloquear solo después de las 8:00 AM
    const horaCo = ahoraCo.getHours() + ahoraCo.getMinutes() / 60;
    return horaCo >= this.HORA_BLOQUEO;
  }

  private ahoraColombia(): Date {
    const offsetMs = -5 * 60 * 60 * 1000;
    return new Date(Date.now() + offsetMs);
  }

  private soloDia(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}