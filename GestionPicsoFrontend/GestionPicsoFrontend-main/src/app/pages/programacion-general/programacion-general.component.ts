import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ProgramacionSemanalService, ProgramacionSemanal } from '../../services/programacion-semanal.service';
import { ObraService, Obra } from '../../services/obras.service';

@Component({
  selector: 'app-programacion-general',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './programacion-general.component.html',
  styleUrls: ['./programacion-general.component.css']
})
export class ProgramacionGeneralComponent implements OnInit {
  programaciones: ProgramacionSemanal[] = [];
  obras: Obra[] = [];
  cargando = false;
  semanaActual = '';
  fechaInicioRango = '';
  fechaFinRango = '';
  obrasAbiertas: Set<number> = new Set();

  moverEmpleadoId: number | null = null;
  moverProgramacionId: number | null = null;
  mostrarModalMover = false;
  obraDestinoId: number | null = null;

  private programacionService = inject(ProgramacionSemanalService);
  private obraService = inject(ObraService);
  private router = inject(Router);

  ngOnInit(): void {
    this.semanaActual = this.calcularSemanaActual();
    this.cargarDatos();
    this.obraService.getObras().subscribe(data => this.obras = data);
  }

  private calcularSemanaActual(): string {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diffLunes = (dia === 0 ? -6 : 1 - dia);
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + diffLunes);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    this.fechaInicioRango = this.formatDate(lunes);
    this.fechaFinRango = this.formatDate(domingo);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `${fmt(lunes)} - ${fmt(domingo)}`;
  }

  onRangoChange(): void {
    if (!this.fechaInicioRango || !this.fechaFinRango) return;
    const inicio = new Date(this.fechaInicioRango + 'T00:00:00');
    const fin = new Date(this.fechaFinRango + 'T00:00:00');
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    this.semanaActual = `${fmt(inicio)} - ${fmt(fin)}`;
    // Re-cargar con el nuevo rango aplicado
    this.cargarDatos();
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  cargarDatos(): void {
    this.cargando = true;
    this.programacionService.getTodas(this.fechaInicioRango, this.fechaFinRango).subscribe({
      next: (data) => {
        // FIX: filtrar por el rango seleccionado, no mostrar todo el historial
        this.programaciones = this.filtrarPorRango(data);
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private filtrarPorRango(data: ProgramacionSemanal[]): ProgramacionSemanal[] {
    if (!this.fechaInicioRango || !this.fechaFinRango) return data;
    const inicio = new Date(this.fechaInicioRango + 'T00:00:00');
    const fin = new Date(this.fechaFinRango + 'T23:59:59');
    return data.filter(p => {
      const pInicio = new Date(p.fechaInicioSemana);
      const pFin = new Date(p.fechaFinSemana);
      // La programación se solapa con el rango si empieza antes del fin Y termina después del inicio
      return pInicio <= fin && pFin >= inicio;
    });
  }

  get obraIds(): number[] {
    return [...new Set(this.programaciones.map(p => p.obraId))];
  }

  getPorObra(obraId: number): ProgramacionSemanal[] {
    return this.programaciones.filter(p => p.obraId === obraId);
  }

  getNombreObra(obraId: number): string {
    return this.programaciones.find(p => p.obraId === obraId)?.obraNombre || `Obra ${obraId}`;
  }

  toggleObra(obraId: number): void {
    if (this.obrasAbiertas.has(obraId)) {
      this.obrasAbiertas.delete(obraId);
    } else {
      this.obrasAbiertas.add(obraId);
    }
  }

  estaAbierta(obraId: number): boolean {
    return this.obrasAbiertas.has(obraId);
  }

  eliminar(id: number): void {
    if (!confirm('¿Quitar este empleado de la programación?')) return;
    this.programacionService.eliminar(id).subscribe({
      next: () => this.cargarDatos(),
      error: () => alert('Error al eliminar')
    });
  }

  abrirModalMover(prog: ProgramacionSemanal): void {
    this.moverProgramacionId = prog.id;
    this.moverEmpleadoId = prog.empleadoId;
    this.obraDestinoId = null;
    this.mostrarModalMover = true;
  }

  confirmarMover(): void {
    if (!this.obraDestinoId || !this.moverProgramacionId || !this.moverEmpleadoId) return;

    // FIX: usar el responsableId real de la obra destino como residenteId
    const obraDestino = this.obras.find(o => o.id === this.obraDestinoId);
    const residenteId = obraDestino?.responsableId ?? 0;

    this.programacionService.eliminar(this.moverProgramacionId).subscribe({
      next: () => {
        this.programacionService.crear([{
          empleadoId: this.moverEmpleadoId!,
          obraId: this.obraDestinoId!,
          residenteId: residenteId
        }]).subscribe({
          next: () => {
            this.mostrarModalMover = false;
            this.cargarDatos();
          },
          error: () => alert('Error al mover empleado')
        });
      },
      error: () => alert('Error al eliminar programación anterior')
    });
  }

  async copiarComoImagen(): Promise<void> {
    const elemento = document.getElementById('seccion-programacion');
    if (!elemento) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('✅ Imagen copiada. Pégala en WhatsApp con Ctrl+V.');
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Programacion-General-${this.semanaActual}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch {
      alert('No se pudo generar la imagen.');
    }
  }
}
