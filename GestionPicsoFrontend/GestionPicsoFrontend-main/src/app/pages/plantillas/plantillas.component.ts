import { Component } from '@angular/core';
import { PlantillasPermisosService } from '../../services/plantillas-permisos.service';
import { saveAs } from 'file-saver';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';


@Component({
  selector: 'app-permisos',
  templateUrl: './plantillas.component.html',
  styleUrls: ['./plantillas.component.css'],
  imports:[BotonRegresarComponent,NavbarComponent]
})
export class PlantillasComponent {
  constructor(private plantillaService: PlantillasPermisosService) {}
descargarPlantilla(tipo: 'alturas' | 'caliente') {
  this.plantillaService.obtenerPlantilla(tipo).subscribe(response => {
    const blob = new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const nombre = tipo === 'alturas' ? 'permiso_alturas.xlsx' : 'permiso_caliente.xlsx';
    saveAs(blob, nombre);
  });
}

}
