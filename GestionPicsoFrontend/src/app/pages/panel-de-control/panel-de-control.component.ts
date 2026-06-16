import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../navbar/navbar.component';

@Component({
  selector: 'app-panel-de-control',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './panel-de-control.component.html',
  styleUrls: ['./panel-de-control.component.css']
})
export class PanelDeControlComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  rol: string | null = null;
  today: string = '';
  totalModulos: number = 0;

  ngOnInit(): void {
    const userData = this.authService.getUserData();
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }
    this.rol = userData.rol?.toLowerCase().trim() ?? null;
    this.today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
    this.totalModulos = this.rol === 'admin' ? 5 : ['almacenista'].includes(this.rol ?? '') ? 4 : 3;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  irAPersonal(): void { this.router.navigate(['/personal']); }
  irAProyectos(): void { this.router.navigate(['/proyectos']); }
  irASst(): void { this.router.navigate(['/Sst']); }
  irAProductividad(): void { this.router.navigate(['/productividad']); }
  irAProgramacionGeneral(): void { this.router.navigate(['/programacion-general']); }
}