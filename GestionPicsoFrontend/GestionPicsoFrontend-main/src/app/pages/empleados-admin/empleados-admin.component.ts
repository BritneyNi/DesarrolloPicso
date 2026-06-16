import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { EmpleadoService, Empleado } from '../../services/empleado-service.service';
import { ObraService, Obra } from '../../services/obras.service';
import { UserService } from '../../services/user.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-empleados-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './empleados-admin.component.html',
  styleUrls: ['./empleados-admin.component.css']
})
export class EmpleadosAdminComponent implements OnInit {
  modoDetalle = false;
  modoCambioObra = false;
  esResponsable: boolean = false;
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  obras: Obra[] = [];
  responsables: any[] = [];
  searchQuery: string = '';
  puedeVerDatosSensibles: boolean = false;
  telefonoInvalido = false;
  telefonoEmergenciaInvalido = false;
  mostrarFormulario = false;
  esEdicion = false;
  estadoFiltroActual: 'Activo' | 'Todos' = 'Activo';

  // Modal exportar
  mostrarModalExportar = false;
  columnasExportar = [
    { key: 'nombreCompleto', label: 'Nombre', seleccionada: true },
    { key: 'cedula', label: 'Cédula', seleccionada: true },
    { key: 'telefono', label: 'Teléfono', seleccionada: true },
    { key: 'cargo', label: 'Cargo', seleccionada: true },
    { key: 'obra', label: 'Obra', seleccionada: true },
    { key: 'ubicacion', label: 'Ubicación', seleccionada: true },
    { key: 'tipoContrato', label: 'Tipo Contrato', seleccionada: true },
    { key: 'firmoContrato', label: 'Firmó Contrato', seleccionada: true },
    { key: 'salario', label: 'Salario', seleccionada: false },
    { key: 'estado', label: 'Estado', seleccionada: true },
    { key: 'eps', label: 'EPS', seleccionada: true },
    { key: 'fondoPension', label: 'AFP', seleccionada: true },
    { key: 'correo', label: 'Correo', seleccionada: false },
    { key: 'fechaNacimiento', label: 'Fecha Nacimiento', seleccionada: false },
  ];

  tiposContrato: string[] = ['Contratista', 'Indefinido', 'Obra labor', 'Fijo'];

  empleadoActual: Empleado = {
    id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '',
    responsable: 'No asignado', responsableSecundario: 'No asignado',
    estado: 'Activo', salario: 0, bono: null, telefono: null,
    fechaNacimiento: null, aptitudEnAltura: null, vencimientoAptitudAlturas: null,
    numeroCuenta: null, examenIngreso: null, fechaInicioContrato: null,
    fechaRetiro: null, tipoContrato: 'Por definir', firmoContrato: 'Pendiente',
    ubicacion: null, direccion: null, fondoPension: null, eps: null,
    arl: 'SURA', ccf: 'Comfama', pagoLiquidacion: 'No', correo: null,
    telefonoEmergencia: null, fechaReentrenamiento: null, observacion: null
  };

  archivoAptitud?: File;
  nombreArchivo?: string;
  responsableNombre: string = '';
  responsableSecundario: string = '';
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 1;
  ubicaciones: string[] = [];
  filtroUbicacion: string = "";
  filtroFirma: string[] = [];
  filtroFirmaContrato: string = "";
  tipoContrato: string[] = [];
  filtroTipoContrato: string = "";
  filtroMesCumple: number = 0;
  meses: string[] = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  rolUsuario: string = '';
  cedulaUsuario: string | null = null;

  private authService = inject(AuthService);
  private empleadoService = inject(EmpleadoService);
  private obraService = inject(ObraService);
  private userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {}

  ngOnInit(): void {
    this.cargarEmpleados();
    this.cargarObras();
    this.cargarResponsables();
    const user = this.authService.getUserData();
    this.rolUsuario = user?.rol || '';
    this.cedulaUsuario = user?.cedula || null;
    this.esResponsable = this.rolUsuario.toLowerCase() === 'responsable';
    const adminsPermitidos = ['12345', '1037613064', '1095923947', '1000758567'];
    this.puedeVerDatosSensibles = adminsPermitidos.includes(this.cedulaUsuario || '');
    document.addEventListener('keydown', this.handleEscapeKey);
    this.route.queryParams.subscribe(params => {
      if (params['sinDotacion']) { this.estadoFiltroActual = 'Activo'; this.filtrarEmpleados(); return; }
      if (params['liquidacionPendiente']) {
        this.estadoFiltroActual = 'Todos';
        this.empleadosFiltrados = this.empleados.filter(e => e.estado === 'Inactivo' && e.pagoLiquidacion && e.pagoLiquidacion.toLowerCase() !== 'pagado');
        return;
      }
      if (params['empleado']) {
        const id = Number(params['empleado']);
        const tab = params['tab'];
        setTimeout(() => this.abrirDesdeNotificacion(id, tab), 400);
      }
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  private handleEscapeKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.mostrarFormulario) this.cerrarFormulario();
  };

  abrirDesdeNotificacion(id: number, tab?: string) {
    const emp = this.empleados.find(e => e.id === id);
    if (!emp) return;
    this.abrirEdicionDirecta(emp);
    requestAnimationFrame(() => { requestAnimationFrame(() => { this.scrollSegunTab(tab); }); });
  }

  scrollSegunTab(tab?: string) {
    const modal = document.querySelector('.modal-content') as HTMLElement;
    if (!modal) return;
    const t = tab?.toLowerCase();
    let targetId = '';
    switch (t) {
      case 'afiliacion': case 'afiliaciones': targetId = 'arl'; break;
      case 'contrato': targetId = 'fechaContrato'; break;
      case 'firmacontrato': case 'contratofirma': case 'contratosinfirma': targetId = 'firmaContrato'; break;
      case 'alturas': targetId = 'alturas'; break;
      case 'examen': targetId = 'examenIngreso'; break;
    }
    if (!targetId) return;
    const target = document.getElementById(targetId) as HTMLElement;
    if (!target) return;
    const offset = target.offsetTop - 100;
    target?.classList.add('highlight-target');
    setTimeout(() => target?.classList.remove('highlight-target'), 2500);
    modal.scrollTo({ top: offset, behavior: 'smooth' });
  }

  irADashboardRRHH(): void { this.router.navigate(['/rrhh/dashboard']); }

  abrirEdicionDirecta(emp: Empleado) {
    this.modoDetalle = false; this.modoCambioObra = false;
    this.empleadoActual = { ...emp }; this.esEdicion = true; this.mostrarFormulario = true;
  }

  descargarContrato(id: number): void {
    this.empleadoService.descargarContratoPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `Contrato_Empleado_${id}.pdf`; a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => { console.error('Error al descargar contrato:', err); alert('No se pudo generar el contrato.'); }
    });
  }

  verDetalles(empleado: Empleado) {
    this.empleadoActual = { ...empleado }; this.modoDetalle = true;
    this.mostrarFormulario = true; this.esEdicion = false; this.modoCambioObra = false;
    if (empleado.aptitudArchivo) {
      this.empleadoService.obtenerArchivoSas(empleado.id).subscribe(res => { this.empleadoActual.aptitudArchivoSas = res.urlSas; });
    }
  }

  editarDesdeDetalle() { this.modoDetalle = false; this.modoCambioObra = false; this.esEdicion = true; this.normalizarFechasParaEditar(); }

  abrirCambioObra(empleado: any) {
    this.modoDetalle = false; this.mostrarFormulario = true; this.esEdicion = true;
    this.modoCambioObra = true; this.empleadoActual = { ...empleado };
  }

  cargarEmpleados(): void {
    this.empleadoService.obtenerEmpleados(1, 1000).subscribe({
      next: (data) => {
        this.empleados = data.map(e => ({ ...e, aptitudArchivoSas: e.aptitudArchivo || e.aptitudArchivo }));
        this.filtroFirma = [...new Set(this.empleados.filter(e => e.firmoContrato).map(e => e.firmoContrato!))];
        this.tipoContrato = [...new Set(this.empleados.filter(e => e.tipoContrato).map(e => e.tipoContrato!))];
        this.ubicaciones = [...new Set(this.empleados.filter(e => e.estado === 'Activo' && e.ubicacion).map(e => e.ubicacion!))];
        this.filtrarEmpleados();
      },
      error: (err) => console.error('Error al obtener empleados:', err)
    });
  }

  verArchivo(ruta: string): void {
    if (!ruta) { alert('No hay archivo disponible para este empleado.'); return; }
    window.open(ruta, '_blank');
  }

  cargarObras(): void {
    this.obraService.getObras().subscribe({ next: (data) => { this.obras = data; }, error: (err) => console.error('Error al obtener obras:', err) });
  }

  cargarResponsables(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const listaResponsables = data.filter(user => user.rol && user.rol.toLowerCase() === 'responsable').map(user => ({ id: user.id, nombre: user.nombreCompleto || 'Nombre no disponible' }));
        this.responsables = [{ id: null, nombre: 'Sin responsable' }, ...listaResponsables];
      },
      error: (err) => console.error('Error al obtener responsables:', err)
    });
  }

  onMesCumpleChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroMesCumple = parseInt(val, 10) || 0;
    this.filtrarEmpleados();
  }

  filtrarEmpleados(): void {
    let lista = [...this.empleados];
    if (this.estadoFiltroActual === 'Activo') lista = lista.filter(e => e.estado === 'Activo');
    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase();
      lista = lista.filter(e => (e.nombreCompleto || "").toLowerCase().includes(q) || (e.cedula || "").toLowerCase().includes(q) || (e.cargo || "").toLowerCase().includes(q) || (e.telefono || "").toLowerCase().includes(q) || (e.numeroCuenta || "").toLowerCase().includes(q) || (e.obra || "").toLowerCase().includes(q) || (e.ubicacion || "").toLowerCase().includes(q));
    }
    if (this.filtroUbicacion.trim() !== "") lista = lista.filter(e => (e.ubicacion || "").toLowerCase() === this.filtroUbicacion.toLowerCase());
    if (this.filtroFirmaContrato.trim() !== "") lista = lista.filter(e => (e.firmoContrato || "").toLowerCase() === this.filtroFirmaContrato.toLowerCase());
    if (this.filtroTipoContrato.trim() !== "") lista = lista.filter(e => (e.tipoContrato || "").toLowerCase() === this.filtroTipoContrato.toLowerCase());
    const mesFiltro = +this.filtroMesCumple;
    if (mesFiltro > 0) {
      lista = lista.filter(e => {
        if (!e.fechaNacimiento) return false;
        const parts = String(e.fechaNacimiento).substring(0, 10).split('-');
        return parseInt(parts[1], 10) === mesFiltro;
      });
    }
    lista.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, undefined, { sensitivity: "base" }));
    this.empleadosFiltrados = lista;
    this.totalPaginas = Math.ceil(this.empleadosFiltrados.length / this.itemsPorPagina);
    this.paginaActual = 1;
  }

  get empleadosPaginados(): Empleado[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.empleadosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number): void {
    this.paginaActual += delta;
    if (this.paginaActual < 1) this.paginaActual = 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
  }

  cumpleEsteMes(fechaNacimiento: Date | string | null | undefined): boolean {
    if (!fechaNacimiento) return false;
    const parts = String(fechaNacimiento).substring(0, 10).split('-');
    return parseInt(parts[1], 10) - 1 === new Date().getMonth();
  }

  fechaCumple(fechaNacimiento: Date | string | null | undefined): string {
    if (!fechaNacimiento) return '';
    const parts = String(fechaNacimiento).substring(0, 10).split('-');
    return parts[2] + '/' + parts[1];
  }

  mostrarFormularioEmpleado(empleado: Empleado | null = null): void {
    this.modoDetalle = false; this.modoCambioObra = false; this.mostrarFormulario = true;
    this.esEdicion = !!empleado;
    this.empleadoActual = empleado ? { ...empleado } : {
      id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '',
      responsable: 'No asignado', responsableSecundario: 'No asignado',
      estado: 'Activo', salario: 0, bono: null, telefono: null,
      fechaNacimiento: null, aptitudEnAltura: null, numeroCuenta: null,
      fechaInicioContrato: null, fechaRetiro: null, tipoContrato: 'Por definir',
      firmoContrato: 'Pendiente', ubicacion: null, direccion: null,
      fondoPension: null, eps: null, arl: 'SURA', ccf: 'Comfama',
      pagoLiquidacion: 'No', correo: null, telefonoEmergencia: null,
      fechaReentrenamiento: null, observacion: null, aptitudArchivo: null, vencimientoAptitudAlturas: null
    };
    this.normalizarFechasParaEditar();
    if (this.empleadoActual.obra) this.actualizarResponsables();
  }

  actualizarResponsables(): void {
    const obraSeleccionada = this.obras.find(o => o.nombreObra === this.empleadoActual.obra);
    if (obraSeleccionada) {
      this.responsableNombre = obraSeleccionada.responsableNombre || 'No asignado';
      this.responsableSecundario = obraSeleccionada.responsableSecundario || 'No asignado';
      this.empleadoActual.responsable = this.responsableNombre;
      this.empleadoActual.responsableSecundario = this.responsableSecundario;
    } else {
      this.responsableNombre = 'No asignado'; this.responsableSecundario = 'No asignado';
      this.empleadoActual.responsable = 'No asignado'; this.empleadoActual.responsableSecundario = 'No asignado';
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.empleadoActual = {
      id: 0, cedula: '', nombreCompleto: '', cargo: '', obra: '',
      responsable: '', responsableSecundario: '', salario: 0, bono: null,
      estado: 'Activo', telefono: null, fechaNacimiento: null,
      aptitudEnAltura: null, numeroCuenta: null, examenIngreso: null,
      fechaInicioContrato: null, fechaRetiro: null, tipoContrato: 'Por definir',
      firmoContrato: 'Pendiente', ubicacion: null, direccion: null,
      fondoPension: null, eps: null, arl: 'SURA', ccf: 'Comfama',
      pagoLiquidacion: 'No', correo: null, telefonoEmergencia: null,
      fechaReentrenamiento: null, observacion: null, aptitudArchivo: null, vencimientoAptitudAlturas: null
    };
    this.responsableNombre = ''; this.responsableSecundario = '';
  }

  guardarEmpleado(): void {
    const e = this.empleadoActual;
    let errores: string[] = [];
    if (this.esResponsable) {
      const original = this.empleados.find(e => e.id === this.empleadoActual.id);
      if (!original) return;
      this.empleadoActual = { ...original, obra: this.empleadoActual.obra, ubicacion: this.empleadoActual.ubicacion };
    }
    if (!e.nombreCompleto?.trim()) errores.push('El nombre completo es obligatorio.');
    if (!e.cargo?.trim()) errores.push('El cargo es obligatorio.');
    if (!e.obra?.trim()) errores.push('La obra es obligatoria.');
    if (!e.estado?.trim()) errores.push('El estado es obligatorio.');
    if (!e.cedula?.trim()) { errores.push('La cedula es obligatoria.'); } else if (e.cedula.trim().length < 7) { errores.push('La cedula debe tener al menos 7 caracteres.'); }
    if (errores.length > 0) { alert('Corrige los siguientes errores antes de guardar:\n\n' + errores.join('\n')); return; }
    const salarioInvalido = this.puedeVerDatosSensibles ? (e.salario ?? 0) <= 0 : false;
    if (!e.cedula || !e.nombreCompleto || !e.cargo || !e.obra || !e.estado || salarioInvalido) { alert('Completa todos los campos requeridos que tienen *.'); return; }
    if (!this.puedeVerDatosSensibles) e.salario = null;
    const cedulaExistente = this.empleados.some(u => u.cedula.trim() === this.empleadoActual.cedula.trim() && u.id !== this.empleadoActual.id);
    if (cedulaExistente) { alert('Ya existe un usuario registrado con esta cedula.'); return; }
    if (e.telefonoEmergencia && e.telefonoEmergencia.toString().length < 7) { alert('El telefono de emergencia debe tener al menos 7 digitos.'); return; }
    if (e.telefono && e.telefono.toString().length < 7) { alert('El telefono principal debe tener al menos 7 digitos.'); return; }
    if (this.empleadoActual.correo && !this.empleadoActual.correo.endsWith('.com')) { alert('El correo debe terminar en .com'); return; }
    e.telefonoEmergencia = e.telefonoEmergencia ? Number(e.telefonoEmergencia) : null;
    if (!e.tipoContrato) e.tipoContrato = "Por definir";
    if (!e.firmoContrato) e.firmoContrato = "Pendiente";
    if (!e.arl) e.arl = "SURA";
    if (!e.ccf) e.ccf = "Sin definir";
    if (!e.responsable) e.responsable = "No asignado";
    if (!e.responsableSecundario) e.responsableSecundario = "No asignado";
    Object.keys(e).forEach((key) => {
      const k = key as keyof typeof e;
      const valor = e[k];
      if (typeof valor === 'string' && (valor.trim() === '' || valor === 'null')) (e as any)[k] = null;
    });
    if (this.esEdicion) {
      this.empleadoService.actualizarEmpleado(e.id, e).subscribe({
        next: () => { const index = this.empleados.findIndex(emp => emp.id === e.id); if (index !== -1) { this.empleados[index] = { ...e }; this.filtrarEmpleados(); } this.cerrarFormulario(); alert('Empleado actualizado correctamente'); },
        error: (err) => console.error('Error al actualizar el empleado:', err)
      });
    } else {
      e.id = 0;
      this.empleadoService.crearEmpleado(e).subscribe({
        next: (res: any) => { this.empleadoActual.id = res.id; this.cargarEmpleados(); this.cerrarFormulario(); alert('Empleado creado correctamente'); },
        error: (err) => console.error('Error al crear el empleado:', err)
      });
    }
  }

  seleccionarArchivo(event: any) { const file = event.target.files[0]; if (file) { this.archivoAptitud = file; this.nombreArchivo = file.name; } }

  permitirSoloNumeros(event: KeyboardEvent) {
    const key = event.key;
    if (!/^[0-9]$/.test(key) && key !== 'Backspace' && key !== 'Tab' && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Delete') event.preventDefault();
  }

  bloquearPegadoInvalido(event: ClipboardEvent) { const textoPegado = event.clipboardData?.getData('text') ?? ''; if (!/^[0-9]*$/.test(textoPegado)) event.preventDefault(); }

  onCargoInput(event: any): void {
    let valor = event.target.value;
    valor = valor.replace(/[^a-zA-Z\s]/g, "");
    const partes = valor.trim().split(/\s+/);
    if (partes.length > 2) valor = partes.slice(0, 3).join(" ");
    event.target.value = valor; this.empleadoActual.cargo = valor;
  }

  onCargoPaste(event: ClipboardEvent): void { event.preventDefault(); alert("No se permite pegar texto en este campo por seguridad."); }

  onUbicacionInput(event: any): void {
    let valor = event.target.value;
    valor = valor.replace(/[^a-zA-Z0-9#\-]/g, "");
    const hashIndex = valor.indexOf("#"); if (hashIndex !== -1) valor = valor.slice(0, hashIndex + 1) + valor.slice(hashIndex + 1).replace(/#/g, "");
    const guionIndex = valor.indexOf("-"); if (guionIndex !== -1) valor = valor.slice(0, guionIndex + 1) + valor.slice(guionIndex + 1).replace(/-/g, "");
    valor = valor.replace(/\s+/g, ""); event.target.value = valor; this.empleadoActual.ubicacion = valor;
  }

  onUbicacionPaste(event: ClipboardEvent): void { event.preventDefault(); alert("No se permite pegar texto en este campo por seguridad."); }

  onDireccionInput(event: any): void {
    let valor = event.target.value;
    valor = valor.replace(/[^a-zA-Z0-9#\-\s]/g, "");
    const hashIndex = valor.indexOf("#"); if (hashIndex !== -1) valor = valor.slice(0, hashIndex + 1) + valor.slice(hashIndex + 1).replace(/#/g, "");
    const guionIndex = valor.indexOf("-"); if (guionIndex !== -1) valor = valor.slice(0, guionIndex + 1) + valor.slice(guionIndex + 1).replace(/-/g, "");
    const espacios = valor.match(/\s/g);
    if (espacios && espacios.length > 6) { let contador = 0; valor = valor.replace(/\s/g, (esp: string) => (++contador <= 2 ? esp : "")); }
    event.target.value = valor; this.empleadoActual.direccion = valor;
  }

  onDireccionPaste(event: ClipboardEvent): void { event.preventDefault(); alert("No se permite pegar texto en este campo por seguridad."); }

  private normalizarFechasParaEditar(): void {
    const camposFecha = ['fechaInicioContrato', 'fechaRetiro', 'examenIngreso', 'vencimientoAptitudAlturas', 'fechaReentrenamiento', 'aptitudEnAltura', 'fechaNacimiento'] as const;
    camposFecha.forEach(campo => { const valor = this.empleadoActual[campo]; if (valor) this.empleadoActual[campo] = new Date(valor).toISOString().substring(0, 10) as any; });
  }

  validarSalario(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    valor = valor.replace(/[^0-9.]/g, ''); let puntos = 0;
    valor = valor.replace(/\./g, (match: string) => (++puntos <= 3 ? match : ''));
    event.target.value = valor;
    const numero = parseFloat(valor.replace(/\./g, ''));
    this.empleadoActual.salario = isNaN(numero) ? 0 : numero;
  }

  verificarSalarioMinimo(event: any): void {
    const valor = parseFloat(event.target.value.replace(/\./g, '')) || 0;
    if (valor < 700000) { alert("El salario no puede ser menor a $700000"); this.empleadoActual.salario = 700000; event.target.value = "700000"; }
  }

  validarBono(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    let letras = 0, puntos = 0, espacios = 0, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[0-9]/.test(c)) { resultado += c; }
      else if (/[a-zA-Z]/.test(c)) { if (letras < 6) { resultado += c; letras++; } }
      else if (c === '.' && puntos < 2) { resultado += c; puntos++; }
      else if (c === ' ' && espacios < 3) { resultado += c; espacios++; }
    }
    event.target.value = resultado; this.empleadoActual.bono = resultado;
  }

  validarEPS(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    let espacios = 0, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[a-zA-Z]/.test(c)) { resultado += c; }
      else if (c === ' ' && espacios < 2) { resultado += c; espacios++; }
    }
    event.target.value = resultado; this.empleadoActual.eps = resultado;
  }

  validarNombreCompleto(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    let espacios = 0, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[a-zA-Z-\u00f1]/.test(c)) { resultado += c; }
      else if (c === ' ' && espacios < 6) { resultado += c; espacios++; }
    }
    event.target.value = resultado; this.empleadoActual.nombreCompleto = resultado;
  }

  validarCorreo(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    if (valor.trim() === '') { this.empleadoActual.correo = ''; return; }
    let arrobas = 0, puntos = 0, guiones = 0, guionesBajos = 0, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[a-zA-Z0-9]/.test(c)) { resultado += c; }
      else if (c === '@' && arrobas < 1) { resultado += c; arrobas++; }
      else if (c === '.' && puntos < 3) { resultado += c; puntos++; }
      else if (c === '-' && guiones < 2) { resultado += c; guiones++; }
      else if (c === '_' && guionesBajos < 2) { resultado += c; guionesBajos++; }
    }
    this.empleadoActual.correo = resultado; event.target.value = resultado;
  }

  permitirCedula(event: KeyboardEvent) {
    const key = event.key; const input = event.target as HTMLInputElement; const valorActual = input.value;
    const esLetra = /^[a-zA-Z]$/.test(key); const esNumero = /^[0-9]$/.test(key); const esPunto = key === ':';
    const letrasActuales = (valorActual.match(/[a-zA-Z]/g) || []).length;
    const puntosActuales = (valorActual.match(/:/g) || []).length;
    if (esLetra && letrasActuales >= 5) { event.preventDefault(); return; }
    if (esPunto && puntosActuales >= 1) { event.preventDefault(); return; }
    if (!esLetra && !esNumero && !esPunto && key !== 'Backspace' && key !== 'Tab' && key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Delete') event.preventDefault();
  }

  bloquearPegadoCedula(event: ClipboardEvent) {
    const texto = event.clipboardData?.getData('text') ?? '';
    const letras = (texto.match(/[a-zA-Z]/g) || []).length;
    const puntos = (texto.match(/:/g) || []).length;
    const valido = /^[a-zA-Z0-9:]+$/.test(texto) && letras <= 5 && puntos <= 1;
    if (!valido) event.preventDefault();
  }

  validarObservacion(event: any): void {
    let valor = event.target.value?.toString() || '';
    let puntos = 0, tieneDolar = false, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1]/.test(c)) { resultado += c; }
      else if (/[0-9]/.test(c)) { resultado += c; }
      else if (c === ' ') { resultado += c; }
      else if (c === '$' && !tieneDolar) { resultado += c; tieneDolar = true; }
      else if (c === '.' && puntos < 2) { resultado += c; puntos++; }
    }
    this.empleadoActual.observacion = resultado; event.target.value = resultado;
  }

  bloquearPegado(event: ClipboardEvent): void { event.preventDefault(); }

  validarNumeroCuenta(event: any): void {
    let valor = event.target.value?.toString() || '';
    event.target.onpaste = (e: ClipboardEvent) => e.preventDefault();
    let guiones = 0, espacios = 0, resultado = '';
    for (let i = 0; i < valor.length; i++) {
      const c = valor[i];
      if (/[0-9]/.test(c)) { resultado += c; }
      else if (c === '-' && guiones < 3) { resultado += c; guiones++; }
      else if (c === ' ' && espacios < 2) { resultado += c; espacios++; }
    }
    this.empleadoActual.numeroCuenta = resultado; event.target.value = resultado;
  }

  subirArchivo() {
    if (!this.archivoAptitud) { alert('Selecciona un archivo primero.'); return; }
    if (!this.empleadoActual.id) { alert('Debes guardar primero el empleado antes de subir el archivo.'); return; }
    this.empleadoService.subirAptitudArchivo(this.empleadoActual.id, this.archivoAptitud).subscribe({
      next: (res: any) => {
        if (!res || !res.urlSas) { return console.error('No se recibio URL SAS del backend'); }
        this.empleadoActual.aptitudArchivo = res.blobName;
        const index = this.empleados.findIndex(e => e.id === this.empleadoActual.id);
        if (index >= 0) this.empleados[index] = { ...this.empleados[index], aptitudArchivo: res.blobName };
        this.filtrarEmpleados(); alert('Archivo subido correctamente');
      },
      error: (err) => console.error('Error al subir archivo:', err)
    });
  }

  filtrarPorEstado(estado: 'Activo' | 'Todos'): void { this.estadoFiltroActual = estado; this.filtrarEmpleados(); }

  abrirArchivo(id: number) {
    this.empleadoService.obtenerArchivoSas(id).subscribe({
      next: (res) => { if (!res || !res.urlSas) { return console.error('No se recibio URL SAS'); } window.open(res.urlSas, '_blank'); },
      error: (err) => { console.error('Error al obtener archivo SAS:', err); alert('Error al obtener el archivo. Intenta nuevamente'); }
    });
  }

  exportarExcel(): void {
    const columnas = this.columnasExportar.filter(c => c.seleccionada).map(c => c.label);
    const filtros = {
      estado: this.estadoFiltroActual !== 'Todos' ? this.estadoFiltroActual : null,
      ubicacion: this.filtroUbicacion || null,
      tipoContrato: this.filtroTipoContrato || null,
      firmoContrato: this.filtroFirmaContrato || null,
    };
    this.empleadoService.exportarExcel(filtros, columnas).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Empleados_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.mostrarModalExportar = false;
      },
      error: (err) => {
        console.error('Error al exportar:', err);
        alert('Error al generar el Excel.');
      }
    });
  }
}
