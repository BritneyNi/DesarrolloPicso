import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService } from '../../services/user.service';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/user.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-obras-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './obras-admin.component.html',
  styleUrls: ['./obras-admin.component.css']
})
export class ObrasAdminComponent implements OnInit {
  obras: Obra[] = [];
  obrasFiltrados: Obra[] = [];
  responsables: (User | null)[] = [];
  responsablesSecundarios: { id: number | null; nombre: string }[] = [];
  sstDisponibles: { id: number | null; nombre: string }[] = [];
  clientes: { id: number | null; nombre: string }[] = [];
  searchQuery: string = '';
  estadoSeleccionado: 'Activo' | 'Inactivo' | 'todos' = 'Activo';
  todosLosEmpleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosSeleccionados: number[] = [];
  empleadosDetalleList: Empleado[] = [];
  busquedaEmpleado: string = '';
  filtroCargoModal: string = '';
  cargosDisponibles: string[] = [];
  mostrarFormulario = false;
  modoDetalle = false;
  esEdicion = false;
  semanaActual: string = '';
  fechaInicioRango: string = '';
  fechaFinRango: string = '';
  esSST: boolean = false;
  nombreUsuario: string = '';

  obraActual: Omit<Obra, 'id'> & { id?: number; responsableSecundario?: string } = {
    id: undefined, nombreObra: '', responsableId: null,
    responsableSecundario: 'Sin SST', clienteObra: 'Sin cliente',
    estado: 'Activo', costoObra: 0, ciudad: 'sin definir', ubicacion: 'sin definir',
    tamano: undefined, fechaInicio: '', fechaFin: '', turnoObra: 'Diurno'
  };

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.modoDetalle) { this.cerrarDetalle(); return; }
    if (this.mostrarFormulario) { this.cerrarFormulario(); }
  }

  esResponsable: boolean = false;
  private authService = inject(AuthService);
  private obraService = inject(ObraService);
  private userService = inject(UserService);
  private empleadoService = inject(EmpleadoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.esResponsable = userData?.rol?.toLowerCase() === 'responsable';
    this.esSST = userData?.rol?.toLowerCase() === 'sst';
    this.nombreUsuario = userData?.nombreCompleto || '';
    this.semanaActual = this.calcularSemanaActual();
    this.cargarObrasPorEstado();
    this.cargarResponsables();
    this.cargarClientes();
    this.cargarEmpleados();

    this.route.queryParams.subscribe(params => {
      const obraId = params['obraId'];
      const nuevo = params['nuevo'];
      if (nuevo === 'true') {
        setTimeout(() => this.mostrarFormularioObra(null), 500);
      } else if (obraId) {
        setTimeout(() => {
          const obra = this.obras.find(o => o.id === parseInt(obraId));
          if (obra) {
            this.verObrerosObra(obra);
          } else {
            this.obraService.getObra(parseInt(obraId)).subscribe({
              next: (data) => this.verObrerosObra(data),
              error: () => {}
            });
          }
        }, 1500);
      }
    });
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
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 500).subscribe({
      next: (data) => {
        this.todosLosEmpleados = data.filter(e => e.estado?.toLowerCase() === 'activo');
        this.empleadosFiltrados = [...this.todosLosEmpleados];
        this.cargosDisponibles = [...new Set(
          this.todosLosEmpleados.filter(e => e.cargo).map(e => e.cargo)
        )].sort() as string[];
      },
      error: (err) => console.error('Error:', err)
    });
  }

  filtrarEmpleadosModal(): void {
    const q = this.busquedaEmpleado.toLowerCase();
    this.empleadosFiltrados = this.todosLosEmpleados.filter(e =>
      (!q || e.nombreCompleto?.toLowerCase().includes(q)) &&
      (!this.filtroCargoModal || e.cargo === this.filtroCargoModal)
    );
  }

  toggleEmpleado(id: number): void {
    const idx = this.empleadosSeleccionados.indexOf(id);
    if (idx === -1) this.empleadosSeleccionados.push(id);
    else this.empleadosSeleccionados.splice(idx, 1);
    this.empleadosDetalleList = this.todosLosEmpleados.filter(e =>
      this.empleadosSeleccionados.includes(e.id)
    );
  }

  estaSeleccionado(id: number): boolean {
    return this.empleadosSeleccionados.includes(id);
  }

  contarTurno(turno: string): number {
    return this.empleadosDetalleList.filter(e => (e.turno || 'Diurno') === turno).length;
  }

  verObrerosObra(obra: Obra): void {
    this.obraActual = { ...obra, turnoObra: obra.turnoObra || 'Diurno' };
    this.busquedaEmpleado = '';
    this.filtroCargoModal = '';

    const abrirModal = () => {
      this.empleadosFiltrados = [...this.todosLosEmpleados];
      this.obraService.getEmpleadosPorObra(obra.id).subscribe({
        next: (empleados) => {
          this.empleadosSeleccionados = empleados.map(e => e.id);
          this.empleadosDetalleList = this.todosLosEmpleados.filter(e =>
            this.empleadosSeleccionados.includes(e.id)
          );
          this.modoDetalle = true;
          this.mostrarFormulario = true;
        },
        error: () => alert('Error al cargar obreros')
      });
    };

    if (this.todosLosEmpleados.length > 0) {
      abrirModal();
    } else {
      this.empleadoService.obtenerEmpleados(1, 500).subscribe({
        next: (data) => {
          this.todosLosEmpleados = data.filter(e => e.estado?.toLowerCase() === 'activo');
          this.cargosDisponibles = [...new Set(
            this.todosLosEmpleados.filter(e => e.cargo).map(e => e.cargo)
          )].sort() as string[];
          abrirModal();
        },
        error: (err) => console.error('Error:', err)
      });
    }
  }

guardarAsignacion(): void {
  if (!this.obraActual.id) return;
  this.obraService.asignarEmpleados(this.obraActual.id, this.empleadosSeleccionados).subscribe({
    next: () => {
      alert('Obreros asignados correctamente');
      this.obraService.getEmpleadosPorObra(this.obraActual.id!).subscribe({
        next: (empleados) => {
          this.empleadosSeleccionados = empleados.map(e => e.id);
          this.empleadosDetalleList = this.todosLosEmpleados.filter(e =>
            this.empleadosSeleccionados.includes(e.id)
          );
        }
      });
    },
    error: () => alert('Error al guardar')
  });
}

  cerrarDetalle(): void {
  this.modoDetalle = false;
  this.mostrarFormulario = false;
  this.empleadosSeleccionados = [];
  this.empleadosDetalleList = [];
  this.busquedaEmpleado = '';
  this.filtroCargoModal = '';
  this.empleadosFiltrados = [...this.todosLosEmpleados];
  if ((this.esResponsable || this.esSST) && this.obraActual.id) {
    this.router.navigate(['/obra', this.obraActual.id], { replaceUrl: true });
  }
}

  getNombreResponsable(): string {
    if (!this.obraActual.responsableId) return 'Sin responsable';
    const resp = this.responsables.find((r: any) => r?.id === this.obraActual.responsableId) as any;
    return resp?.nombreCompleto || 'Sin responsable';
  }

  async copiarComoImagen(): Promise<void> {
    const elemento = document.getElementById('seccion-screenshot');
    if (!elemento) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          alert('✅ Imagen copiada al portapapeles. Pégala en WhatsApp con Ctrl+V.');
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Programacion-${this.obraActual.nombreObra}-${this.semanaActual}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (e) {
      alert('No se pudo generar la imagen.');
    }
  }

  exportarDetallePDF(): void {
    const img = new Image();
    img.src = 'assets/img/Logopicso.png';
    const dibujar = () => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const W = pdf.internal.pageSize.getWidth();
      const H = pdf.internal.pageSize.getHeight();
      const fmt = (f: string) => f ? new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
      const campo = (label: string, value: string, x: number, y: number) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(109, 109, 115);
        pdf.setFontSize(7.5);
        pdf.text(label, x, y);
        const lw = pdf.getTextWidth(label);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(8);
        pdf.text(value, x + lw + 1, y);
      };
      pdf.setFillColor(109, 109, 115);
      pdf.rect(0, 0, W, 24, 'F');
      pdf.addImage(img, 'PNG', 8, 3, 18, 18);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Listado de Personal Asignado a Obra', W / 2, 11, { align: 'center' });
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(233, 224, 219);
      const fechaGen = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
      pdf.text(`Generado: ${fechaGen}`, W / 2, 18, { align: 'center' });
      pdf.setFillColor(247, 246, 243);
      pdf.rect(14, 28, W - 28, 54, 'F');
      pdf.setDrawColor(209, 209, 209);
      pdf.rect(14, 28, W - 28, 54, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(79, 78, 77);
      pdf.setFontSize(8);
      pdf.text('INFORMACION DE LA OBRA', 18, 35);
      campo('Obra:', this.obraActual.nombreObra || '-', 18, 43);
      campo('Cliente:', this.obraActual.clienteObra || '-', 110, 43);
      campo('Responsable:', this.getNombreResponsable(), 18, 51);
      campo('Ciudad:', this.obraActual.ciudad || '-', 110, 51);
      campo('Inicio:', fmt(this.obraActual.fechaInicio), 18, 59);
      campo('Fin:', fmt(this.obraActual.fechaFin), 63, 59);
      campo('Turno:', this.obraActual.turnoObra || 'Diurno', 110, 59);
      campo('Tamano:', this.obraActual.tamano ? `${this.obraActual.tamano} m2` : '-', 152, 59);
      campo('Total obreros:', `${this.empleadosDetalleList.length} persona(s)`, 18, 67);
      autoTable(pdf, {
        startY: 88,
        head: [['#', 'Nombre completo', 'Cedula', 'Cargo', 'Turno']],
        body: this.empleadosDetalleList.map((emp, i) => [i + 1, emp.nombreCompleto, emp.cedula, emp.cargo, emp.turno || 'Diurno']),
        headStyles: { fillColor: [109, 109, 115], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [247, 246, 243] },
        styles: { fontSize: 8.5, textColor: [50, 50, 50] },
        columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 4: { halign: 'center' } },
        didDrawPage: (data) => {
          pdf.setFillColor(109, 109, 115);
          pdf.rect(0, H - 12, W, 12, 'F');
          pdf.setTextColor(183, 204, 18);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.text('PICSO INGENIERIA - Listado de personal asignado a obra', 14, H - 5);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`Pag. ${data.pageNumber}`, W - 14, H - 5, { align: 'right' });
        }
      });
      pdf.save(`Obreros-${this.obraActual.nombreObra}-${new Date().toISOString().split('T')[0]}.pdf`);
    };
    if (img.complete && img.naturalWidth > 0) { dibujar(); }
    else { img.onload = () => dibujar(); img.onerror = () => dibujar(); }
  }

  cargarObrasPorEstado(): void {
    if (this.estadoSeleccionado === 'Activo') {
      this.obraService.getObras().subscribe(data => { this.obras = data; this.filtrarObras(); });
    } else if (this.estadoSeleccionado === 'Inactivo') {
      this.obraService.getObrasInactivas().subscribe(data => { this.obras = data; this.filtrarObras(); });
    } else {
      Promise.all([this.obraService.getObras().toPromise(), this.obraService.getObrasInactivas().toPromise()])
        .then(([activas, inactivas]) => { this.obras = [...(activas ?? []), ...(inactivas ?? [])]; this.filtrarObras(); });
    }
  }

  cargarResponsables(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const responsablesActivos = data.filter(user => user.rol?.toLowerCase() === 'responsable' && user.estado?.toLowerCase() === 'activo');
        this.responsables = [null, ...responsablesActivos];
        this.responsablesSecundarios = [
          { id: null, nombre: 'Sin responsable Secundario' },
          ...responsablesActivos.map(user => ({ id: user.id, nombre: user.nombreCompleto || 'Nombre no disponible' }))
        ];
        this.sstDisponibles = [
          { id: null, nombre: 'Sin SST' },
          ...data.filter(user => user.rol?.toLowerCase() === 'sst' && user.estado?.toLowerCase() === 'activo')
            .map(user => ({ id: user.id, nombre: user.nombreCompleto || 'Sin nombre' }))
        ];
      },
      error: (err) => console.error('Error:', err)
    });
  }

  cargarClientes(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const listaClientes = data.filter(user => user.rol && user.rol.toLowerCase() === 'cliente')
          .map(user => ({ id: user.id, nombre: user.nombreCompleto || 'Nombre no disponible' }));
        this.clientes = [{ id: null, nombre: 'Sin cliente' }, ...listaClientes];
        if (!this.obraActual.clienteObra) this.obraActual.clienteObra = 'Sin cliente';
      },
      error: (err) => console.error('Error:', err)
    });
  }

  filtrarObras(): void {
    const q = this.searchQuery.toLowerCase();
    this.obrasFiltrados = this.obras.filter(o => {
      const coincideBusqueda = !q ||
        o.nombreObra?.toLowerCase().includes(q) ||
        o.clienteObra?.toLowerCase().includes(q) ||
        o.responsableSecundario?.toLowerCase().includes(q);
      const coincideSST = !this.esSST ||
        o.responsableSecundario?.trim().toLowerCase() === this.nombreUsuario?.trim().toLowerCase();
      return coincideBusqueda && coincideSST;
    });
  }

  InactivarObra(id: number): void {
    if (confirm('Deseas inactivar esta obra?')) {
      this.obraService.inactivarObra(id).subscribe({
        next: () => { this.obras = this.obras.filter(o => o.id !== id); this.filtrarObras(); alert('Obra inactivada'); },
        error: (err) => console.error('Error:', err)
      });
    }
  }

  reactivarObra(id: number): void {
    if (confirm('Deseas reactivar esta obra?')) {
      this.obraService.reactivarObra(id).subscribe({
        next: () => { alert('Obra reactivada'); this.cargarObrasPorEstado(); },
        error: (err) => console.error('Error:', err)
      });
    }
  }

  mostrarFormularioObra(obra: Obra | null = null): void {
    this.mostrarFormulario = true;
    this.modoDetalle = false;
    this.esEdicion = !!obra;
    this.empleadosSeleccionados = [];
    this.busquedaEmpleado = '';
    this.filtroCargoModal = '';
    this.empleadosFiltrados = [...this.todosLosEmpleados];
    if (obra) {
      this.obraActual = { ...obra, responsableId: obra.responsableId ?? null, responsableSecundario: obra.responsableSecundario || 'Sin SST', clienteObra: obra.clienteObra || 'Sin cliente', turnoObra: obra.turnoObra || 'Diurno' };
    } else {
      this.obraActual = { id: undefined, nombreObra: '', responsableId: null, responsableSecundario: 'Sin SST', clienteObra: 'Sin cliente', estado: 'Activo', costoObra: 0, ciudad: 'sin definir', ubicacion: 'sin definir', fechaFin: '', fechaInicio: '', turnoObra: 'Diurno' };
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoDetalle = false;
    this.empleadosSeleccionados = [];
    this.busquedaEmpleado = '';
    this.filtroCargoModal = '';
    this.obraActual = { id: undefined, nombreObra: '', responsableId: null, responsableSecundario: 'Sin SST', clienteObra: 'Sin cliente', estado: 'Activo', costoObra: 0, ciudad: 'sin definir', ubicacion: 'sin definir', fechaFin: '', fechaInicio: '', turnoObra: 'Diurno' };
  }

  cargarObrasInactivas(): void {
    this.obraService.getObrasInactivas().subscribe({
      next: (data) => { this.obras = data; this.filtrarObras(); },
      error: (err) => console.error('Error:', err)
    });
  }

  private obtenerErroresBackend(error: any): string[] {
    if (!error?.error?.errors) return ['Error desconocido'];
    const errores: string[] = [];
    Object.keys(error.error.errors).forEach(key => {
      const mensajes = error.error.errors[key];
      if (Array.isArray(mensajes)) errores.push(...mensajes);
    });
    return errores;
  }

  guardarObra(): void {
    if (!this.obraActual.nombreObra) { return; }
    this.obraActual.estado = this.obraActual.estado || 'Activo';
    if (this.esEdicion) {
      const obraAEnviar: Obra = { id: this.obraActual.id ?? 0, nombreObra: this.obraActual.nombreObra, responsableId: this.obraActual.responsableId, clienteObra: this.obraActual.clienteObra, estado: this.obraActual.estado, costoObra: this.obraActual.costoObra, ciudad: this.obraActual.ciudad, ubicacion: this.obraActual.ubicacion, responsableSecundario: this.obraActual.responsableSecundario, tamano: this.obraActual.tamano ?? 0, fechaInicio: this.obraActual.fechaInicio, fechaFin: this.obraActual.fechaFin, turnoObra: this.obraActual.turnoObra ?? 'Diurno' };
      this.obraService.editObra(obraAEnviar.id, obraAEnviar).subscribe({
        next: () => { alert('Obra actualizada'); this.cargarObrasPorEstado(); this.cerrarFormulario(); },
        error: (error) => { alert(this.obtenerErroresBackend(error).join('\n')); }
      });
    } else {
      const obraNueva: Omit<Obra, 'id'> = { nombreObra: this.obraActual.nombreObra, responsableId: this.obraActual.responsableId, clienteObra: this.obraActual.clienteObra, estado: 'Activo', costoObra: this.obraActual.costoObra, ciudad: this.obraActual.ciudad, ubicacion: this.obraActual.ubicacion, responsableSecundario: this.obraActual.responsableSecundario, tamano: this.obraActual.tamano ?? 0, fechaInicio: this.obraActual.fechaInicio, fechaFin: this.obraActual.fechaFin, turnoObra: this.obraActual.turnoObra ?? 'Diurno' };
      this.obraService.createObra(obraNueva).subscribe({
        next: () => { alert('Obra creada'); this.cargarObrasPorEstado(); this.cerrarFormulario(); },
        error: (error) => { alert(this.obtenerErroresBackend(error).join('\n')); }
      });
    }
  }
}