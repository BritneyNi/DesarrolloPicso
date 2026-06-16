import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boton-regresar',
  templateUrl: './boton-regresar.component.html',
  styleUrls: ['./boton-regresar.component.css']
})
export class BotonRegresarComponent {

  constructor(private location: Location, private router: Router) {}

  goBack(): void {
      // Comportamiento original: vuelve al historial
      this.location.back();
    }
  
}
