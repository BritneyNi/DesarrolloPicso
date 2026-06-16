import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-proyectos',
imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './productividad.component.html',
  styleUrl: './productividad.component.css'
})
export class ProductividadComponent {
 private authService = inject(AuthService);
  private router = inject(Router);
  rol: string | null = null;

  private route = inject(ActivatedRoute);
  obraId!: number;

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    this.rol = userData?.rol?.toLowerCase() ?? null;

    if (!this.rol || (this.rol !== 'admin' && this.rol !== 'almacenista')) {
      this.router.navigate(['/home']);
    }

    this.obraId = Number(this.route.snapshot.paramMap.get('obraId'));

  if (!this.obraId) {
    console.error('❌ obraId no definido');
    return;
  }
  }

  irAMetricas(): void {
    this.router.navigate(['/metricas']).then(success => {
    });
  }

   irARendimiento(): void {
    this.router.navigate(['/rendimiento/:nombreObra']).then(success => {
    });
  }

   irAVerRendimiento(): void {
    this.router.navigate(['/ver-rendimientos']).then(success => {
    });
  }

  irAGrafica() {
  this.router.navigate(['/gantt-dashboard',this.obraId]);
}

}
