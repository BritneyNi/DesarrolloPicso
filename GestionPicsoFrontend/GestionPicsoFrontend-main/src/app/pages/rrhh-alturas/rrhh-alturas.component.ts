import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router } from '@angular/router';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { NavbarComponent } from "../../navbar/navbar.component";
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";

@Component({
  selector: 'app-rrhh-alturas',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent,FormsModule],
  templateUrl: './rrhh-alturas.component.html',
  styleUrls: ['./rrhh-alturas.component.css']
})
export class RrhhAlturasComponent implements OnInit {

  empleados: any[] = [];
  estado: string = '';
  loading = true;
  editandoId: number | null = null;
  terminoBusqueda: string = '';
  empleadosOriginal: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private service: RrhhDashboardService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.estado = params['estado'];
      this.cargarDatos();
    });
  }

cargarDatos() {
  this.loading = true;

  if (this.estado === 'vigentes') {
    this.service.getAlturasVigentes().subscribe(res => {
      this.empleadosOriginal = res;
      this.empleados = [...res];
      this.loading = false;
    });
  }

  else if (this.estado === 'vencidos') {
    this.service.getAlturasVencidos().subscribe(res => {
      this.empleadosOriginal = res;
      this.empleados = [...res];

      this.loading = false;
    });
  }

  else if (this.estado === 'sin-curso') {
    this.service.getAlturasSinCurso().subscribe(res => {
      this.empleadosOriginal = res;
      this.empleados = [...res];
      this.loading = false;
    });
  }

  else {
    // 🔥 fallback por si llega vacío
    this.empleados = [];
    this.loading = false;
  }
}



  cambiarEstado(nuevoEstado: string) {
  this.estado = nuevoEstado;

  this.router.navigate([], {
    relativeTo: this.route,
    queryParams: { estado: nuevoEstado },
    queryParamsHandling: 'merge',
    replaceUrl:true
    });

  this.cargarDatos();
}


editar(e: any) {
  this.editandoId = e.id;
}

guardar(e: any) {
  const data = {
    aptitudEnAltura: e.fechaCurso,
    vencimientoAptitudAlturas: e.fechaVencimiento
  };

  this.service.actualizarAlturas(e.id, data).subscribe(() => {
    this.editandoId = null;
    this.cargarDatos();
  });
}

cancelar() {
  this.editandoId = null;
  this.cargarDatos(); // recarga para restaurar valores originales
}

filtrar() {
  const termino = this.terminoBusqueda.toLowerCase();

  this.empleados = this.empleadosOriginal.filter(e =>
    e.nombreCompleto?.toLowerCase().includes(termino) ||
    e.cedula?.toString().includes(termino) ||
    e.cargo?.toLowerCase().includes(termino) ||
    e.obra?.toLowerCase().includes(termino)
  );
}


}

