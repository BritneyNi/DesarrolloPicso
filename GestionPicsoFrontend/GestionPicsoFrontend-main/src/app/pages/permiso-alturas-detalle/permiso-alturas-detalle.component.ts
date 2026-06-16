import { Component, OnInit, } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { PermisoAlturasService } from '../../services/permiso-alturas.service';
import { CommonModule } from '@angular/common';
import { JsonParsePipe } from '../../pipes/json-parse.pipe';
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";


@Component({
  selector: 'app-permiso-alturas-detalle',
  standalone: true,
  imports: [CommonModule, JsonParsePipe, BotonRegresarComponent],
  templateUrl: './permiso-alturas-detalle.component.html',
  styleUrls: ['./permiso-alturas-detalle.component.css']
  
})


export class PermisoAlturasDetalleComponent implements OnInit {

  permiso: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private permisoService: PermisoAlturasService
  ) {}

 ngOnInit() {
  const id = this.route.snapshot.paramMap.get('id');
  
  if (id) {
    this.permisoService.obtener(id).subscribe(res => {
      this.permiso = res;
    });
  }
}

editarPermiso() {
  this.router.navigate(
    ['/permisos-alturas/editar', this.permiso.id]
  );
}

}
