import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { ListaObrasComponent } from '../../lista-obras/lista-obras.component';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, NavbarComponent, ListaObrasComponent]
})
export class HomeComponent implements OnInit {
  authService = inject(AuthService);
  rol: string | null = null;
  usuario: string | null = null;

 ngOnInit() {
  const userData = this.authService.getUserData();
  if (userData) {
    this.rol = userData.rol?.toLowerCase() ?? null;
    this.usuario = userData.nombreCompleto || null;

    console.log('ROL HOME:', this.rol);
  }
}


}
