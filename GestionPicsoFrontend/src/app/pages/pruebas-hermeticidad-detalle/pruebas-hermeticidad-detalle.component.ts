import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PruebasHermeticidadService } from '../../services/pruebas-hermeticidad.service';
import { PruebaHermeticidad } from '../../services/pruebas-hermeticidad.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-prueba-hermeticidad-detalle',
  standalone: true,
  imports: [CommonModule,FormsModule,BotonRegresarComponent],
  templateUrl: './pruebas-hermeticidad-detalle.component.html',
  styleUrls: ['./pruebas-hermeticidad-detalle.component.css']
})
export class PruebaHermeticidadDetalleComponent {

  prueba: PruebaHermeticidad | null = null;
  modoEdicion = false;

  constructor(
    private route: ActivatedRoute,
    private service: PruebasHermeticidadService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const edit = this.route.snapshot.queryParamMap.get('edit');

    this.modoEdicion = edit === 'true';

    if (id) {
    this.service.obtenerPorId(+id).subscribe({
    next: (data) => {
      this.prueba = data;
    },
    error: (err) => {
      console.error('ERROR 👉', err);
    }
  });
  }
  }

  guardarCambios() {
  if (!this.prueba?.id) return;

  this.service.actualizarPrueba(this.prueba.id, this.prueba)
    .subscribe({
      next: () => {
        alert('✅ Cambios guardados');
        this.modoEdicion = false;
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error guardando');
      }
    });
  }

  descargarPdf() {
  if (!this.prueba?.id) return;

  const id = this.prueba.id;

  this.service.descargarPdf(id).subscribe(blob => {

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Prueba_${id}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);
  });
  }

}