import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { SignupComponent } from './pages/signup/signup.component';
import { ListaObrasComponent } from './lista-obras/lista-obras.component';
import { DetalleObraComponent } from './pages/detalle-obra/detalle-obra.component';
import { GestionPersonalComponent } from './pages/gestion-personal/gestion-personal.component';
import { PanelDeControlComponent } from './pages/panel-de-control/panel-de-control.component';
import { UsuariosAdminComponent } from './pages/usuarios-admin/usuarios-admin.component';
import { EmpleadosAdminComponent } from './pages/empleados-admin/empleados-admin.component';
import { ObrasAdminComponent } from './pages/obras-admin/obras-admin.component';
import { TiemposAdminComponent } from './pages/tiempos-admin/tiempos-admin.component';
import { PermisosAdminComponent } from './pages/permisos-admin/permisos-admin.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { MovimientoComponent } from './pages/movimiento/movimiento-component';
import { SolicitudesComponent } from './pages/solicitudes/solicitudes.component';
import { InventarioInternoComponent } from './pages/inventario-interno/inventario-interno.component';
import { InventariosComponent } from './pages/inventarios/inventarios.component';
import { RevisionInventarioComponent } from './pages/revision-inventario/revision-inventario.component';
import { PruebasComponent } from './pages/pruebas/pruebas.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { MetricasComponent } from './pages/metricas/metricas.component';
import { RendimientoComponent } from './pages/rendimiento/rendimiento.component';
import { VerRendimientosComponent } from './pages/ver-rendimientos/ver-rendimientos.component';
import { ContratistaComponent } from './pages/contratista/contratista.component';
import { PersonalComponent } from './pages/personal/personal.component';
import { ProyectosComponent } from './pages/operaciones/proyectos.component';
import { HorarioComponent } from './pages/horario/horario.component';
import { ProductividadComponent } from './pages/productividad/productividad.component';
import { AtsComponent } from './pages/Ats/ats.component';
import { PlantillasComponent } from './pages/plantillas/plantillas.component';
import { PermisoAlturasComponent } from './pages/permiso-alturas/permiso-alturas.component';
import { SstComponent } from './pages/SST/sst.component';
import { PermisoAlturasDetalleComponent } from './pages/permiso-alturas-detalle/permiso-alturas-detalle.component';
import { PermisoCalienteComponent } from './pages/permiso-caliente/permiso-caliente.component';
import { PermisoCalienteDetalleComponent } from './pages/permiso-caliente-detalle/permiso-caliente-detalle.component';
import { PermisoCalientePersonalComponent } from './pages/permiso-caliente-personal/permiso-caliente-personal.component';
import { DotacionComponent } from './pages/dotacion/dotacion.component';
import { EntregaDotacionComponent } from './pages/entrega-dotacion/entrega-dotacion.component';
import { EntregaDotacionHistorialComponent } from './pages/entrega-dotacion-historial/entrega-dotacion-historial.component';
import { InventarioElementoComponent } from './pages/inventario-dotacion/inventario-elemento.component';
import { InventarioGeneralComponent } from './Inventario-general-dotacion/InventarioGeneralComponent';
import { sstGuard } from './guards/sst.guard';
import { almacenistaGuard } from './guards/almacenista.guard';
import { RrhhDashboardComponent } from './pages/rrhh-dashboard/rrhh-dashboard.component';
import { RrhhContratosPendientesComponent } from './pages/rrhh-contratos-pendientes/rrhh-contratos-pendientes.component';
import { AfiliacionesSinComponent } from './pages/rrhh-afiliaciones-sin/rrhh-afiliaciones-sin.component';
import { RrhhExamenIngresoSinComponent } from './pages/rrhh-examen-ingreso-sin/rrhh-examen-ingreso-sin.component';
import { RrhhDotacionComponent } from './pages/rrhh-dotacion/rrhh-dotacion.component';
import { RrhhAlturasComponent } from './pages/rrhh-alturas/rrhh-alturas.component';
import { LiquidacionComponent } from './pages/rrhh-liquidacion/rrhh-liquidacion.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { GanttDashboardComponent } from './pages/gantt-dashboard/gantt-dashboard.component';
import { PruebasHermeticidadComponent } from './pages/pruebas-hermeticidad/pruebas-hermeticidad.component';
import { PruebaHermeticidadDetalleComponent } from './pages/pruebas-hermeticidad-detalle/pruebas-hermeticidad-detalle.component';
import { ProgramacionGeneralComponent } from './pages/programacion-general/programacion-general.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'obras', component: ListaObrasComponent, canActivate: [authGuard] },
  { path: 'gestionIngresos', component: GestionPersonalComponent, canActivate: [authGuard] },
  { path: 'gestionIngresos/:nombreObra', component: GestionPersonalComponent, canActivate: [authGuard] },
  { path: 'panel-control', component: PanelDeControlComponent, canActivate: [authGuard] },
  { path: 'usuario-admin', component: UsuariosAdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'empleado-admin', component: EmpleadosAdminComponent, canActivate: [authGuard] },
  { path: 'obras-admin', component: ObrasAdminComponent, canActivate: [authGuard, almacenistaGuard] },
  { path: 'tiempos-admin', component: TiemposAdminComponent, canActivate: [authGuard, sstGuard] },
  { path: 'permisos-admin', component: PermisosAdminComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'obra/:id', component: DetalleObraComponent, canActivate: [authGuard] },
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard] },
  { path: 'movimientos', component: MovimientoComponent, canActivate: [authGuard, almacenistaGuard] },
  { path: 'solicitudes', component: SolicitudesComponent, canActivate: [authGuard] },
  { path: 'inventario-interno/:nombreObra', component: InventarioInternoComponent, canActivate: [authGuard] },
  { path: 'inventarios', component: InventariosComponent, canActivate: [authGuard, almacenistaGuard] },
  { path: 'revision-inventario', component: RevisionInventarioComponent, canActivate: [authGuard] },
  { path: 'metricas', component: MetricasComponent, canActivate: [authGuard] },
  { path: 'pruebas', component: PruebasComponent, canActivate: [authGuard] },
  { path: 'rendimiento/:nombreObra', component: RendimientoComponent, canActivate: [authGuard] },
  { path: 'ver-rendimientos', component: VerRendimientosComponent, canActivate: [authGuard] },
  { path: 'contratista', component: ContratistaComponent, canActivate: [authGuard] },
  { path: 'personal', component: PersonalComponent, canActivate: [authGuard, sstGuard] },
  { path: 'proyectos', component: ProyectosComponent, canActivate: [authGuard, almacenistaGuard] },
  { path: 'horario', component: HorarioComponent, canActivate: [authGuard, sstGuard] },
  { path: 'productividad', component: ProductividadComponent, canActivate: [authGuard] },
  { path: 'ats', component: AtsComponent, canActivate: [authGuard] },
  { path: 'plantillas', component: PlantillasComponent, canActivate: [authGuard] },
  { path: 'permiso-alturas', component: PermisoAlturasComponent, canActivate: [authGuard] },
  { path: 'permisos-alturas/editar/:id', component: PermisoAlturasComponent, canActivate: [authGuard] },
  { path: 'Sst', component: SstComponent, canActivate: [authGuard] },
  { path: 'permiso-alturas-detalle/:id', component: PermisoAlturasDetalleComponent, canActivate: [authGuard] },
  { path: 'permiso-caliente', component: PermisoCalienteComponent, canActivate: [authGuard] },
  { path: 'permiso-caliente-detalle/:id', component: PermisoCalienteDetalleComponent, canActivate: [authGuard] },
  { path: 'permiso-caliente-editar/:id', component: PermisoCalienteComponent, canActivate: [authGuard] },
  { path: 'permiso-caliente/:id/personal', component: PermisoCalientePersonalComponent, canActivate: [authGuard] },
  { path: 'dotacion', component: DotacionComponent, canActivate: [authGuard] },
  { path: 'entregas', component: EntregaDotacionComponent, canActivate: [authGuard] },
  { path: 'historial-entregas', component: EntregaDotacionHistorialComponent, canActivate: [authGuard] },
  { path: 'inventario/:id', component: InventarioElementoComponent, canActivate: [authGuard] },
  { path: 'inventario-general', component: InventarioGeneralComponent, canActivate: [authGuard] },
  { path: 'rrhh/dashboard', component: RrhhDashboardComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/contratos/pendientes', component: RrhhContratosPendientesComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/afiliaciones/:estado', component: AfiliacionesSinComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/examen-ingreso', component: RrhhExamenIngresoSinComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/dotacion', component: RrhhDotacionComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/alturas', component: RrhhAlturasComponent, canActivate: [authGuard, sstGuard] },
  { path: 'rrhh/liquidacion', component: LiquidacionComponent, canActivate: [authGuard, sstGuard] },
  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [authGuard, sstGuard] },
  { path: 'gantt-dashboard/:obraId', component: GanttDashboardComponent, canActivate: [authGuard] },
  { path: 'pruebas-hermeticidad', component: PruebasHermeticidadComponent, canActivate: [authGuard] },
  { path: 'pruebas-hermeticidad/:id', component: PruebaHermeticidadDetalleComponent, canActivate: [authGuard] },
  { path: 'programacion-semanal/:obraId/:obraNombre', loadComponent: () => import('./pages/programacion-semanal/programacion-semanal.component').then(m => m.ProgramacionSemanalComponent), canActivate: [authGuard] },
  { path: 'programacion-general', component: ProgramacionGeneralComponent, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' }
];