import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { RegistroJornadaService, ResumenEmpleado } from './registrojornada.service';
import { AusentismoService, TiempoAusentismo } from './documento-permiso.service';
import { TiemposService, Tiempo } from './tiempos.service.service';
import { forkJoin } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  constructor(
    private registroJornadaService: RegistroJornadaService,
    private ausentismoService: AusentismoService,
    private tiemposService: TiemposService
  ) {}

  generarYExportarExcel(
    fechaInicio: string,
    fechaFin: string,
    ubicacion?: string,
    obra?: string,
    empleadosFiltrados?: ResumenEmpleado[]
  ) {
    forkJoin({
      jornadas: this.registroJornadaService.obtenerResumenHoras(fechaInicio, fechaFin),
      aus: this.ausentismoService.getDocumentos(),
      tiempos: this.tiemposService.obtenerTiempos()
    }).subscribe(({ jornadas, aus, tiempos }) => {

      let jornadasFiltradas: ResumenEmpleado[] = empleadosFiltrados ?? jornadas;

      if (ubicacion && ubicacion.toLowerCase() !== 'todos') {
        jornadasFiltradas = jornadasFiltradas.filter(j =>
          (j.ubicacion || '').trim().toLowerCase() === ubicacion.trim().toLowerCase()
        );
      }

      if (obra && obra.toLowerCase() !== 'todos') {
        jornadasFiltradas = jornadasFiltradas.filter(j =>
          (j.obra || '').trim().toLowerCase() === obra.trim().toLowerCase()
        );
      }

      const tiemposEnRango = (tiempos || []).filter(t =>
        this.tiempoEnRango(t, fechaInicio, fechaFin)
      );

      const nombresFiltrados = new Set(
        jornadasFiltradas.map(j => (j.nombreCompleto || '').trim().toLowerCase())
      );

      const ausFiltrados = aus.filter(a =>
        nombresFiltrados.has((a.nombreEmpleado || '').trim().toLowerCase())
      );

      const tiemposFiltrados = tiemposEnRango.filter(t =>
        nombresFiltrados.has((t.nombreEmpleado || '').trim().toLowerCase())
      );

      jornadasFiltradas = jornadasFiltradas.map(j => {
        let baseFecha: Date;
        if (j.fecha && !isNaN(new Date(j.fecha).getTime())) {
          baseFecha = new Date(j.fecha);
        } else if (fechaInicio && !isNaN(new Date(`${fechaInicio}T00:00:00`).getTime())) {
          baseFecha = new Date(`${fechaInicio}T00:00:00`);
        } else {
          baseFecha = new Date();
        }

        const parseHora = (texto: string, fechaBase: Date): string | null => {
          if (!texto) return null;
          const limpio = texto.toLowerCase().replace(/\s+/g, '');
          const match = limpio.match(/(\d{1,2}):(\d{2})/);
          if (!match) return null;
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const esPM = limpio.includes('pm') || limpio.includes('p.m');
          if (esPM && h < 12) h += 12;
          if (!esPM && h === 12) h = 0;
          const f = new Date(fechaBase);
          f.setHours(h, m, 0, 0);
          return isNaN(f.getTime()) ? null : f.toISOString();
        };

        if (typeof j.horaEntrada === 'string' && !j.horaEntrada.includes('T')) {
          j.horaEntrada = parseHora(j.horaEntrada, baseFecha) || '';
        }
        if (typeof j.horaSalida === 'string' && !j.horaSalida.includes('T')) {
          j.horaSalida = parseHora(j.horaSalida, baseFecha) || '';
        }
        if (!j.fecha || isNaN(new Date(j.fecha).getTime())) {
          j.fecha = baseFecha.toISOString();
        }
        return j;
      });

      const jornMap = this.groupBy(jornadasFiltradas, j => j.nombreCompleto.trim().toLowerCase());
      const ausMap = this.groupBy(ausFiltrados, a => a.nombreEmpleado.trim().toLowerCase());
      const tiemposMap = this.groupBy(tiemposFiltrados, t => (t.nombreEmpleado || '').trim().toLowerCase());
      const nombreOriginalMap: { [k: string]: string } = {};
      jornadasFiltradas.forEach(j => {
        nombreOriginalMap[j.nombreCompleto.trim().toLowerCase()] = j.nombreCompleto;
      });

      const allKeys = new Set([
        ...Object.keys(jornMap),
        ...Object.keys(ausMap),
        ...Object.keys(tiemposMap)
      ]);

      const wb = XLSX.utils.book_new();

      allKeys.forEach(key => {
        const nombreOriginal = nombreOriginalMap[key] || key;
        const js = jornMap[key] || [];
        const as = ausMap[key] || [];
        const filas: any[] = [];

        js.forEach(j => {
          if (!j.horaEntrada || !j.horaSalida) return;
          const entrada = new Date(j.horaEntrada);
          const salida = new Date(j.horaSalida);
          if (isNaN(entrada.getTime()) || isNaN(salida.getTime())) return;
          if (salida < entrada) salida.setDate(salida.getDate() + 1);

          j.horaEntrada = entrada.toISOString();
          j.horaSalida = salida.toISOString();
          j.fecha = entrada.toISOString();

          const resultado = this.calcularHorasJornada(j.horaEntrada, j.horaSalida);
          j.extNoctDom = resultado.extNoctDom;
          j.horasExtrasDiurnas = resultado.extra;
          j.horasNocturnas = resultado.noct;
          j.horasExtrasNocturnas = resultado.exNoct;
          j.horasRecargoNocturnoDominical = resultado.recNoctDom;
          j.horasDominicales = resultado.dom;
          j.trabajoDomingo = entrada.getDay() === 0 || salida.getDay() === 0;
          j.trabajoSabado = entrada.getDay() === 6;
          j.trabajoFestivo = false;

          filas.push(...this.rowFromJornada(
            j, ' ',
            resultado.total,
            resultado.extra,
            resultado.noct,
            resultado.exNoct,
            resultado.recNoctDom,
            resultado.dom,
            entrada
          ));
        });

        as.forEach(a => {
          const ini = this.parseLocalDate(a.fechaInicio);
          const fin = this.parseLocalDate(a.fechaFin);
          for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
            filas.push(this.rowFromAusentismo(a, this.truncDate(d)));
          }
        });

        filas.sort((x, y) => {
          const a = x.fechaObj?.getTime() ?? 0;
          const b = y.fechaObj?.getTime() ?? 0;
          return a !== b ? a - b : (x.horaNum ?? 0) - (y.horaNum ?? 0);
        });

        const aoa: any[][] = [[
          'FECHA ENTRADA', 'FECHA SALIDA', 'DIA', 'HORA ENTRA', 'HORA SALE',
          'TOTAL', 'EXTRA (+25%)', 'NOCT (+35%)', 'EX. NOCT',
          'REC. NOCT. DOM.', 'DOM (+80%)', 'EXT. DOM', 'EXT. NOCT. DOM'
        ]];

        filas.forEach(f => {
          aoa.push([
            this.formatDate(f.fechaEntrada || f.fecha),
            this.formatDate(f.fechaSalida || f.fecha),
            f.diaTexto,
            f.entrada,
            f.salida,
            f.total,
            '',
            '',
            '',
            '',
            '',
            '',
            ''
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const name = nombreOriginal.slice(0, 31).replace(/[\[\]\*\/\\\?]/g, '');
        XLSX.utils.book_append_sheet(wb, ws, name);
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Resumen_Jornada_Empleados.xlsx');
    });
  }

  private calcularHorasJornada(horaEntrada: string, horaSalida: string) {
    const entrada = new Date(horaEntrada);
    const salida = new Date(horaSalida);
    if (isNaN(entrada.getTime()) || isNaN(salida.getTime()))
      return { total: 0, extra: 0, noct: 0, exNoct: 0, recNoctDom: 0, dom: 0, extDom: 0, extNoctDom: 0 };

    if (salida < entrada) salida.setDate(salida.getDate() + 1);

    let totalHoras = (salida.getTime() - entrada.getTime()) / 3_600_000;
    const hEntrada = entrada.getHours();
    const esTurnoNocturno = hEntrada >= 20 || hEntrada < 6;

    if (esTurnoNocturno) {
      totalHoras -= 1;
    } else if (totalHoras >= 6) {
      const empiezaAntesMediodia = entrada.getHours() < 12;
      const terminaDespuesTarde = salida.getHours() > 14 || (salida.getHours() === 14 && salida.getMinutes() > 0);
      if (empiezaAntesMediodia && terminaDespuesTarde) totalHoras -= 1.5;
      else totalHoras -= 1.0;
    }

    totalHoras = Math.max(0, totalHoras);
    const horasExtrasTotales = Math.max(0, totalHoras - 8);

    let noct = 0, extrasNocturnas = 0, recNoctDom = 0, extNoctDom = 0;
    let dom = 0, extraDom = 0, acumuladoNormal = 0, extrasDiurnasClamped = 0;

    let cursor = new Date(entrada);
    while (cursor < salida) {
      const next = new Date(Math.min(cursor.getTime() + 10 * 60 * 1000, salida.getTime()));
      const horas = (next.getTime() - cursor.getTime()) / 3_600_000;
      const hDecimal = cursor.getHours() + cursor.getMinutes() / 60;
      const esNoct = hDecimal >= 21 || hDecimal < 6;
      const esDom = cursor.getDay() === 0;

      const faltan = Math.max(0, 8 - acumuladoNormal);
      const normales = Math.min(horas, faltan);
      const extras = horas - normales;

      if (normales > 0) {
        if (esDom) {
          if (esNoct) recNoctDom += normales;
          else dom += normales;
        } else {
          if (esNoct) noct += normales;
          else acumuladoNormal += normales;
        }
      }

      if (extras > 0) {
        if (esDom) {
          if (esNoct) extNoctDom += extras;
          else extraDom += extras;
        } else {
          if (esNoct) extrasNocturnas += extras;
          else extrasDiurnasClamped += extras;
        }
      }

      cursor = next;
    }

    extrasDiurnasClamped = Math.max(0, horasExtrasTotales - extrasNocturnas - extNoctDom - extraDom);

    return {
      total: Number(totalHoras.toFixed(2)),
      extra: Number(extrasDiurnasClamped.toFixed(2)),
      noct: Number(noct.toFixed(2)),
      exNoct: Number(extrasNocturnas.toFixed(2)),
      recNoctDom: Number(recNoctDom.toFixed(2)),
      dom: Number(dom.toFixed(2)),
      extDom: Number(extraDom.toFixed(2)),
      extNoctDom: Number(extNoctDom.toFixed(2))
    };
  }

  private rowFromJornada(
    j: ResumenEmpleado,
    fuente = 'JORNADA',
    totalBase?: number,
    extraDiurnas?: number,
    nocturnas?: number,
    extraNocturnas?: number,
    recargoNoctDom?: number,
    extraDomParam?: number,
    fechaBase?: Date
  ): any[] {
    const entrada = new Date(j.horaEntrada);
    let salida = new Date(j.horaSalida);
    if (salida < entrada) salida.setDate(salida.getDate() + 1);

    let diaTexto = this.weekdayISO(entrada);
    if (entrada.getDate() !== salida.getDate()) {
      diaTexto = `${this.weekdayISO(entrada)}/${this.weekdayISO(salida)}`;
    }

    let dom80Final = j.trabajoDomingo ? (extraDomParam ?? 0) : 0;
    let extraDomFinal = 0;
    if (j.trabajoDomingo) {
      if (!j.trabajoSabado) {
        if (dom80Final > 8) { extraDomFinal = dom80Final - 8; dom80Final = 8; }
      } else {
        extraDomFinal = dom80Final > 8 ? dom80Final - 8 : 0;
        dom80Final = Math.min(dom80Final, 8);
      }
    }

    const formatLocalDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    return [{
      fechaEntrada: formatLocalDate(entrada),
      fechaSalida: formatLocalDate(salida),
      diaTexto,
      entrada: this.hhmm(entrada.toISOString()),
      salida: this.hhmm(salida.toISOString()),
      total: Number((totalBase ?? 0).toFixed(2)),
      extra25: Number((extraDiurnas ?? j.horasExtrasDiurnas).toFixed(2)),
      noct35: Number(((nocturnas ?? j.horasNocturnas) || 0).toFixed(2)),
      extraNocturnas: Number(((extraNocturnas ?? j.horasExtrasNocturnas) || 0).toFixed(2)),
      recargoNoctDom: Number(((recargoNoctDom ?? j.horasRecargoNocturnoDominical) || 0).toFixed(2)),
      dom75: Number(dom80Final.toFixed(2)),
      extraDom: Number(extraDomFinal.toFixed(2)),
      extNoctDom: Number((j.extNoctDom ?? 0).toFixed(2)),
      esAusente: false,
      fuente,
      fechaObj: fechaBase ?? entrada,
      notas: ''
    }];
  }

  private rowFromAusentismo(a: TiempoAusentismo, fecha: Date): any {
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    // FIX: usar el campo tipo directamente en vez de parsear comentarios
    const tipoMap: Record<string, string> = {
      'incapacidad':          'INCAPACIDAD',
      'enfermedad_general':   'ENFERMEDAD GENERAL',
      'calamidad_familiar':   'CALAMIDAD FAMILIAR',
      'sin_justificacion':    'AUSENTISMO',
      'descanso':             'DESCANSO',
      'permiso':              'PERMISO',
      'suspension':           'SUSPENSION',
    };

    const tipoAusencia = tipoMap[a.tipo?.toLowerCase() ?? ''] ?? 'AUSENTE';

    return {
      fecha: iso, fechaEntrada: iso, fechaSalida: iso,
      fechaObj: fecha, diaTexto: this.weekdayISO(fecha),
      entrada: tipoAusencia, salida: tipoAusencia,
      total: 0, extra25: 0, noct35: 0, extraNocturnas: 0,
      recargoNoctDom: 0, dom75: 0, extraDom: 0, extNoctDom: 0,
      esAusente: true, fuente: 'AUSENTISMO', notas: a.comentarios || ''
    };
  }

  private rowFromTiempo(t: Tiempo, tipo: 'entrada' | 'salida', fechaFallback: Date): any {
    const horaIso = tipo === 'entrada' ? t.fechaHoraEntrada : t.fechaHoraSalida;
    const dt = horaIso ? new Date(horaIso) : fechaFallback;
    const fechaIso = horaIso
      ? horaIso.split('T')[0]
      : `${fechaFallback.getFullYear()}-${String(fechaFallback.getMonth() + 1).padStart(2, '0')}-${String(fechaFallback.getDate()).padStart(2, '0')}`;
    const horaText = horaIso ? this.hhmm(horaIso) : '';

    return {
      fecha: fechaIso, fechaEntrada: tipo === 'entrada' ? fechaIso : '',
      fechaSalida: tipo === 'salida' ? fechaIso : '',
      fechaObj: dt, diaTexto: this.weekdayISO(dt),
      entrada: tipo === 'entrada' ? horaText : '',
      salida: tipo === 'salida' ? horaText : '',
      total: 0, extra25: 0, noct35: 0, extraNocturnas: 0,
      recargoNoctDom: 0, dom75: 0, extraDom: 0, extNoctDom: 0,
      esAusente: false, fuente: 'TIEMPO', notas: ''
    };
  }

  private tiempoEnRango(t: Tiempo, fechaInicio: string, fechaFin: string): boolean {
    const fecha = t.fechaHoraEntrada || t.fechaHoraSalida;
    if (!fecha) return false;
    const d = new Date(fecha);
    return d >= new Date(fechaInicio) && d <= new Date(`${fechaFin}T23:59:59`);
  }

  private parseLocalDate(fecha: string): Date {
    const [y, m, d] = fecha.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private truncDate(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  private formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private weekdayISO(d: Date): string {
    const dias = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
    return dias[d.getDay()];
  }

  private hhmm(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private groupBy<T>(arr: T[], fn: (t: T) => string): { [k: string]: T[] } {
    return arr.reduce((r, o) => {
      const k = fn(o);
      (r[k] ||= []).push(o);
      return r;
    }, {} as { [k: string]: T[] });
  }
}