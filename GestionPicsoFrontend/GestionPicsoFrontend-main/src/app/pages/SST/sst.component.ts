import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-sst',
  standalone: true,
  imports: [CommonModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './sst.component.html',
  styleUrl: './sst.component.css'
})
export class SstComponent implements OnInit{
  
  rol: string | null = null;
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
  const userData = this.authService.getUserData();

  if (!userData) {
    this.router.navigate(['/login']);
    return;
  }

  this.rol = userData.rol?.toLowerCase().trim() ?? null;
}

  irAAts(): void {
  this.router.navigate(['/ats']).then(success => {});


}

irAPlantillas(): void {
  this.router.navigate(['/plantillas']).then(success => {});
}
irAPermisoAlturas() {
  this.router.navigate(['/permiso-alturas']);
}
irAPermisoCaliente(){
  this.router.navigate(['/permiso-caliente']);
}

/*irADotacion(): void {
  this.router.navigate(['/dotacion']);
}*/

}
