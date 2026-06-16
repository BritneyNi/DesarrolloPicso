import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ObraService, Obra } from '../../services/obras.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-detalle-obra',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './detalle-obra.component.html',
  styleUrls: ['./detalle-obra.component.css']
})
export class DetalleObraComponent {
  obra: Obra | null = null;
  cargo: string | null = null;
  usuario: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private obraService = inject(ObraService);
  private authService = inject(AuthService);

  constructor() {
    const userData = this.authService.getUserData();
    if (userData) {
      this.cargo = userData.rol?.toLowerCase() || null;
      this.usuario = userData.nombreCompleto || null;
    }
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.obraService.getObra(id).subscribe({
        next: (data) => { this.obra = data; },
        error: (err) => { console.error('No hay obra cargada'); }
      });
    }
  }

  irAHome() {
    this.router.navigate(['/home']);
  }

  irAGestionPersonal() {
    if (this.obra && this.obra.nombreObra) {
      const nombreObraUrl = this.obra.nombreObra.replace(/\s+/g, '-');
      this.router.navigate(['/gestionIngresos', nombreObraUrl]);
    }
  }

  irAProgramacionSemanal() {
    if (this.obra) {
      this.router.navigate(['/programacion-semanal', this.obra.id, encodeURIComponent(this.obra.nombreObra)]);
    }
  }

  irAAsignarEmpleados() {
    if (this.obra) {
      this.router.navigate(['/obras-admin'], {
        queryParams: { obraId: this.obra.id }
      });
    }
  }

  irADotacion() {
    this.router.navigate(['/dotacion']);
  }

  irAGestionRendimiento(nombreObra: string): void {
    const nombreSanitizado = encodeURIComponent(nombreObra);
    this.router.navigate(['/rendimiento', nombreSanitizado]);
  }

  irASstResponsable() {
    this.router.navigate(['/Sst']);
  }

  irAAusentismos() {
    this.router.navigate(['/permisos-admin']);
  }

  irAHerramientasObra() {
    if (!this.obra) return;
    const nombreObraUrl = encodeURIComponent(this.obra.nombreObra);
    this.router.navigate(['/inventario-interno', nombreObraUrl]);
  }

  irAPruebasHermeticidad() {
    if (!this.obra) return;
    this.router.navigate(['/pruebas-hermeticidad'], {
      queryParams: { obraId: this.obra.id }
    });
  }

  irAGantt() {
    if (!this.obra) return;
    this.router.navigate(['/gantt-dashboard', this.obra.id]);
  }

  irAEmpleadosObra() {
    if (!this.obra) return;
    this.router.navigate(['/empleado-admin'], {
      queryParams: { obra: this.obra.nombreObra }
    });
  }
}