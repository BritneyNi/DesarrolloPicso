import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { ObraService } from '../../services/obras.service';
import { NavbarComponent } from "../../navbar/navbar.component";
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  private userService = inject(UserService);
  private obraService = inject(ObraService);
  

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró token en localStorage');
      return;
    }

    let userId: number;
    try {
      const decoded: any = jwtDecode(token);
      const idStr = decoded.id
        || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      userId = parseInt(idStr, 10);
      if (isNaN(userId)) throw new Error('ID inválido');
    } catch (e) {
      console.error('Error decodificando token:', e);
      return;
    }

    // 1) Cargar datos de usuario
    this.userService.getUserById(userId).subscribe({
      next: userData => {
        this.user = userData;

        // 2) Si tiene obraId, cargar nombre de la obra
        if (this.user.obraId) {
          this.obraService.getObra(this.user.obraId).subscribe({
            next: obraData => {
              this.user.obraNombre = obraData.nombreObra;
            },
            error: () => {
              this.user.obraNombre = '---';
            }
          });
        } else {
          this.user.obraNombre = '---';
        }
      },
      error: err => console.error('Error al cargar perfil:', err)
    });
  }
}
