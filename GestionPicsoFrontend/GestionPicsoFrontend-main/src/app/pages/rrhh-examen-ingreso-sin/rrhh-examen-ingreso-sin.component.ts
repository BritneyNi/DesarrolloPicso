import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-rrhh-examen-ingreso-sin',
  standalone: true,
  imports: [CommonModule, BotonRegresarComponent, NavbarComponent,FormsModule],
  templateUrl: './rrhh-examen-ingreso-sin.component.html',
  styleUrls: ['./rrhh-examen-ingreso-sin.component.css']
})
export class RrhhExamenIngresoSinComponent implements OnInit {

  empleados: any[] = [];
  loading = true;
  vista: 'sin' | 'con' = 'sin';
  empleadosOriginales: any[] = [];
  busqueda: string = '';

constructor( private dashboardService: RrhhDashboardService, private route: ActivatedRoute) {}

  ngOnInit(): void {

  this.route.queryParams.subscribe(params => {

    if (params['vista'] === 'con') {
      this.vista = 'con';
    } else {
      this.vista = 'sin';
    }

    this.cargarDatos();
  });

}

  cambiarVista(tipo: 'sin' | 'con') {
    this.vista = tipo;
    this.cargarDatos();
  }

  cargarDatos() {
  this.loading = true;

  const request = this.vista === 'sin'
    ? this.dashboardService.getEmpleadosSinExamen()
    : this.dashboardService.getEmpleadosConExamen();

  request.subscribe(res => {

  const data = res.map((emp: any) => {
    if (emp.fechaExamenIngreso) {
      emp.fechaExamenIngreso = emp.fechaExamenIngreso.split('T')[0];
    }
    return emp;
  });

  this.empleadosOriginales = data;
  this.empleados = data;

  this.loading = false;
});

}


 guardarFecha(emp: any) {

  const fecha = this.vista === 'sin'
    ? emp.nuevaFecha
    : emp.fechaExamenIngreso;

  if (!fecha) {
    alert("Seleccione una fecha");
    return;
  }

  this.dashboardService
    .actualizarFechaExamen(emp.id, fecha)
    .subscribe(() => {

      alert("Fecha guardada correctamente");

      if (this.vista === 'sin') {
        // Si era sin examen, lo quitamos de la lista
        this.empleados = this.empleados.filter(e => e.id !== emp.id);
      }

      // Si es vista 'con', ya quedó actualizada en el input
      // porque ngModel ya la tiene
    });
}

filtrar() {

  const texto = this.busqueda.toLowerCase().trim();

  if (!texto) {
    this.empleados = this.empleadosOriginales;
    return;
  }

  this.empleados = this.empleadosOriginales.filter(emp =>
    emp.nombreCompleto?.toLowerCase().includes(texto) ||
    emp.cedula?.toLowerCase().includes(texto) ||
    emp.cargo?.toLowerCase().includes(texto) ||
    emp.obra?.toLowerCase().includes(texto)
  );
}


}

