import { Component, OnInit } from '@angular/core';
import { ActivatedRoute,Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PermisoEnCalienteService, PermisoEnCaliente } from '../../services/permiso-caliente.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-permiso-caliente-detalle',
  standalone: true,
  imports: [CommonModule,BotonRegresarComponent],
  templateUrl: './permiso-caliente-detalle.component.html',
  styleUrls: ['./permiso-caliente-detalle.component.css']
})
export class PermisoCalienteDetalleComponent implements OnInit {

  permiso?: PermisoEnCaliente;
  cargando = true;

  elementosProteccion = [
  'Casco con barboquejo','Gafas lente claro','Careta de acrilico',
  'Proteccion auditiva insercion','Guantes hilaza','Careta de soldadura','Proteccion auditiva copa',
  'Guantes carnaza','Basculante de casco','Respirador con cartucho','Guantes vaqueta','Delantal PVC',
  'Respirador material particulado','Guantes caucho','Overol PVC','Gafas de oxicorte','Botas seg dielectricas',
  'Delantal de carnaza','Gafas oscuras','Botas caña alta','Polainas de carnaza'
];

peligros = [
  'Explosion/Incendio','Mordeduras/Picaduras','Choque mecanico o electrico','Ruido o Vibraciones',
  'Caida al mismo o distinto nivel','Locativo','Fugas','Virus/Hongos','Biomecanico','Cargas suspendidas',
  'Iluminacion deficiente','Orden y aseo','Temperatura extrema','Accidente de transito'
];

  constructor(
    private route: ActivatedRoute,
    private permisoService: PermisoEnCalienteService,
    private router: Router
  ) {}

 ngOnInit(): void {
  const id = Number(this.route.snapshot.paramMap.get('id'));
  this.permisoService.obtener(id).subscribe({
    next: data => {
      console.log('PERMISO DETALLE:', data);
      this.permiso = data; // ya viene con arrays de elementos y peligros
      this.cargando = false;
    },
    error: err => {
      console.error(err);
      this.cargando = false;
    }
  });
}
editar() {
  if (!this.permiso?.id) return;

  this.router.navigate(
    ['/permiso-caliente-editar', this.permiso.id],
    { replaceUrl: true } // 👈 CLAVE
  );
}

}
