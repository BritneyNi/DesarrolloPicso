import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css'
})
export class PersonalComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  rol: string | null = null;
  
 ngOnInit(): void {
  const userData = this.authService.getUserData();
  this.rol = userData?.rol?.toLowerCase() ?? null;

  if (!this.rol || (this.rol !== 'admin' && this.rol !== 'sst')) {
    this.router.navigate(['/home']);
  }
}

  
 /* irASst():void{
    this.router.navigate(['/Sst']).then(success =>{});
  }*/

  irAUsuariosAdmin(): void {
    this.router.navigate(['/usuario-admin']).then(success => {
    });
  }

  irAEmpleadosAdmin(): void {
    this.router.navigate(['/empleado-admin']).then(success => {
    });
  }

  irAPermisosAdmin(): void {
    this.router.navigate(['/permisos-admin']).then(success => {
    });
  }

  irADotacion(): void {
    this.router.navigate(['/dotacion']);
  }
  
  irAIngresos(): void {
    this.router.navigate(['/gestionIngresos']).then(success => {
    });
  }

  irATiemposAdmin(): void {
    this.router.navigate(['/tiempos-admin']).then(success => {
    });
  }

  irADashboardRRHH(): void {
    this.router.navigate(['/rrhh/dashboard']);
  }
}
