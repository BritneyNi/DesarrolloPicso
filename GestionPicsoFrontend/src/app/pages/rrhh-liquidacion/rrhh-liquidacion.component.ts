import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from "../../navbar/navbar.component";
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";

@Component({
  selector: 'app-liquidacion',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './rrhh-liquidacion.component.html',
  styleUrl: './rrhh-liquidacion.component.css'
})
export class LiquidacionComponent implements OnInit {

  empleados: any[] = [];
  empleadosFiltrados: any[] = [];

  estadoActivo: string = 'pendientes';
  buscador: string = '';

constructor(
  private dashboardService: RrhhDashboardService,
  private route: ActivatedRoute
) {}


 ngOnInit() {

  this.route.queryParams.subscribe(params => {
    if (params['estado']) {
      this.estadoActivo = params['estado'];
    }

    this.cargarEmpleados();
  });

}


 cargarEmpleados() {
  this.dashboardService.getEmpleadosInactivos().subscribe(data => {
    this.empleados = data;
    this.aplicarFiltro();
  });
}

  cambiarEstado(estado: string) {
    this.estadoActivo = estado;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    let lista = this.empleados;

    if (this.estadoActivo === 'pagadas') {
      lista = lista.filter(e =>
        e.pagoLiquidacion &&
        e.pagoLiquidacion.trim().toLowerCase() === 'si'
      );
    }

    if (this.estadoActivo === 'pendientes') {
      lista = lista.filter(e =>
        e.pagoLiquidacion &&
        e.pagoLiquidacion.trim().toLowerCase() === 'no'
      );
    }

    if (this.estadoActivo === 'sinregistro') {
      lista = lista.filter(e =>
        !e.pagoLiquidacion ||
        e.pagoLiquidacion.trim().toLowerCase() === 'no aplica'
      );
    }

    if (this.buscador) {
      lista = lista.filter(e =>
        e.nombreCompleto?.toLowerCase().includes(this.buscador.toLowerCase())
      );
    }

    this.empleadosFiltrados = lista;
  }

actualizarLiquidacion(empleado: any, nuevoValor: string) {

  empleado.pagoLiquidacion = nuevoValor;

  // Si se está registrando liquidación, lo volvemos Inactivo
  if (nuevoValor.trim().toLowerCase() !== 'no aplica') {
    empleado.estado = 'Inactivo';
  }

  this.dashboardService.actualizarLiquidacion(
    empleado.id,
    empleado.pagoLiquidacion,
    empleado.estado
  ).subscribe(() => {
    this.aplicarFiltro();
  });
}


}
