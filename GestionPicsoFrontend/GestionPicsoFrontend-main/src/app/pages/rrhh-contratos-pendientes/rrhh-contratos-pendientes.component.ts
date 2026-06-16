import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { EmpleadoService } from '../../services/empleado-service.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-rrhh-contratos-pendientes',
  standalone: true,
  imports: [CommonModule, BotonRegresarComponent,NavbarComponent,FormsModule],
  templateUrl: './rrhh-contratos-pendientes.component.html',
  styleUrls: ['./rrhh-contratos-pendientes.component.css']
})
export class RrhhContratosPendientesComponent implements OnInit {

  empleados: any[] = [];
  loading = true;
  error = false;

  vista: 'pendientes' | 'firmados' = 'pendientes';
  total = 0;

  terminoBusqueda = '';
  empleadosFiltrados: any[] = [];
  
  constructor(private dashboardService: RrhhDashboardService,
    private empleadoService: EmpleadoService,
    private route: ActivatedRoute
  ) {}

 ngOnInit(): void {

  this.route.queryParams.subscribe(params => {
    if (params['vista'] === 'firmados') {
      this.vista = 'firmados';
    } else {
      this.vista = 'pendientes';
    }

    this.cargarDatos();
  });

}


devolverPendiente(id: number) {
  this.dashboardService.marcarComoNoFirmado(id).subscribe(() => {
    this.cargarDatos();
    alert('Devuelto a pendiente por firmar contrato');
  });
}


cargarDatos() {

  this.loading = true;
  this.error = false;

  const request = this.vista === 'pendientes'
    ? this.dashboardService.getContratosPendientes()
    : this.dashboardService.getContratosFirmados();

  request.subscribe({
    next: (res) => {
      this.empleados = res;
      this.empleadosFiltrados = res;
      this.total = res.length;
      this.loading = false;
    },
    error: () => {
      this.error = true;
      this.loading = false;
    }
  });
}



cambiarVista(nuevaVista: 'pendientes' | 'firmados') {
  this.vista = nuevaVista;
  this.cargarDatos();
}


marcarFirmado(id: number) {
  this.dashboardService.marcarComoFirmado(id).subscribe(() => {

    this.empleados = this.empleados.filter(e => e.id !== id);
    this.filtrarEmpleados(); // recalcula filtrados automáticamente
    alert('Marcado como firmó contrato exitosamente');
  });
}


descargarContrato(id: number) {
  this.empleadoService.descargarContratoPdf(id).subscribe(blob => {
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Contrato.pdf';
    a.click();
    
    window.URL.revokeObjectURL(url);
  });
}


filtrarEmpleados() {

  const termino = this.terminoBusqueda.toLowerCase().trim();

  this.empleadosFiltrados = this.empleados.filter(emp =>
    emp.nombreCompleto?.toLowerCase().includes(termino) ||
    emp.cedula?.toLowerCase().includes(termino) ||
    emp.cargo?.toLowerCase().includes(termino) ||
    emp.obra?.toLowerCase().includes(termino)
  );

  this.total = this.empleadosFiltrados.length;
}




}
