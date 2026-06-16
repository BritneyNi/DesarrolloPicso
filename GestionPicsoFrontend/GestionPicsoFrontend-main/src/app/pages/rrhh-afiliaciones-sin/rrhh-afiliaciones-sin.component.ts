import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RrhhDashboardService } from '../../services/rrhh-dashboard.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ActivatedRoute,Router } from '@angular/router';
@Component({
  selector: 'app-rrhh-afiliaciones-sin',
  imports: [CommonModule,BotonRegresarComponent,NavbarComponent,FormsModule],
  templateUrl: './rrhh-afiliaciones-sin.component.html',
  styleUrl: './rrhh-afiliaciones-sin.component.css'
})
export class AfiliacionesSinComponent implements OnInit {

  empleados: any[] = [];
  loading = true;
  estado!: string;
  filtro: string = '';

  constructor(private dashboardService: RrhhDashboardService,private route:ActivatedRoute, private router:Router) {}
  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    this.estado = params.get('estado') || 'sin-afiliacion';
    this.cargarDatos();
  });
}



cargarDatos() {
  this.loading = true;

  this.dashboardService.getAfiliacionesPorEstado(this.estado)
    .subscribe(res => {
      this.empleados = res;
      this.loading = false;
    });
}


ir(estado: string) {
  this.router.navigate(
    ['/rrhh/afiliaciones', estado],
    { replaceUrl: true }
  );
}


 // 🔍 Getter para filtrar empleados en tiempo real
  get empleadosFiltrados(): any[] {
    if (!this.filtro.trim()) return this.empleados;
    const filtroLower = this.filtro.toLowerCase();
    return this.empleados.filter(emp =>
      emp.nombreCompleto.toLowerCase().includes(filtroLower) ||
      emp.cedula.toLowerCase().includes(filtroLower) ||
      emp.cargo.toLowerCase().includes(filtroLower)
    );
  }

  resaltar(texto: string): string {
  if (!this.filtro.trim()) return texto;
  const regex = new RegExp(`(${this.filtro})`, 'gi');
  return texto.replace(regex, '<mark style="background:#fef08a">$1</mark>');
}

toggleAfiliar(emp: any) {
  emp.mostrarForm = !emp.mostrarForm;
}

guardarAfiliacion(emp: any) {
  this.dashboardService.actualizarEmpleado(emp.id, {
     Eps: emp.eps,
      ARL: emp.arl,
      FondoPension: emp.fondoPension,
      CCF: emp.ccf
  }).subscribe({
    next: (res) => {
      emp.afiliadoCompleto = true;
      emp.mostrarForm = false;

      // 🔹 Quitar de empleados base para que el getter refleje el cambio
      this.empleados = this.empleados.filter(e => e.id !== emp.id);
    },
    error: (err) => {
      console.error("Error al afiliar", err);
      alert("No se pudo completar la afiliación");
    }
  });
}

}

