import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ActivatedRoute } from '@angular/router';

import {
  SolicitudService,
  Solicitud,
  SolicitudItem,
  EstadoSolicitud,
} from '../../services/solicitud.service';
import { AuthService } from '../../services/auth.service';
import { InventarioService, Inventario } from '../../services/inventario.service';
import { ObraService } from '../../services/obras.service';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule,
    NavbarComponent, BotonRegresarComponent
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  private auth = inject(AuthService);
  private service = inject(SolicitudService);
  private invService = inject(InventarioService);
  private obraService = inject(ObraService);
  private route = inject(ActivatedRoute);

  EstadoSolicitud = EstadoSolicitud;

  esAdmin = false;
  esResponsable = false;
  usuarioActual = '';

  solicitudes: Solicitud[] = [];
  filtradas: Solicitud[] = [];
  filtroEstado: EstadoSolicitud | '' = '';

  inventario: Inventario[] = [];
  obras: any[] = [];

  displayedColumns = [
    'herramienta', 'cantidad', 'obra',
    'solicitante', 'fechaSolicitud', 'estado'
  ];

  nueva: Solicitud = {
    solicitante: '',
    obra: '',
    fechaSolicitud: new Date().toISOString(),
    observaciones: '',
    estado: EstadoSolicitud.Pendiente,
    items: []
  };

  itemTemp: SolicitudItem = {
    inventarioId: 0,
    cantidad: 1
  };

  ngOnInit() {
  const ud = this.auth.getUserData() || {};
  this.usuarioActual = ud.nombreCompleto || '';

 const rol = String(ud.rol || '').toLowerCase();

  this.esAdmin = ['admin', 'almacenista'].includes(rol);
  this.esResponsable = rol === 'responsable';

  this.route.queryParams.subscribe(params => {
  if (params['obra']) {
    this.nueva.obra = decodeURIComponent(params['obra']);
  }

});
// escuchar cambios en solicitudes (tiempo real)
  this.service.solicitudesActualizadas$.subscribe(() => {
    this.cargarSolicitudes();
  });

   if (this.esAdmin) this.displayedColumns.push('acciones');

  this.loadObras();
  this.loadInventarioYDespuesSolicitudes();
}

loadInventarioYDespuesSolicitudes() {
  this.invService.obtenerInventario().subscribe(list => {

    this.inventario = list.filter(i =>
      i.ubicacion.toLowerCase() === 'picso central' &&
      i.cantidad>0
    );

    this.cargarSolicitudes();
  });
}

loadObras() {
  this.obraService.getObras().subscribe(list => {
    this.obras = list;

    const ud = this.auth.getUserData();

    // solo asigna si es responsable y no tiene queryParam
    if (this.esResponsable && ud?.obraId && !this.nueva.obra) {
      const obra = this.obras.find(o => o.id === Number(ud.obraId));
      if (obra) {
        this.nueva.obra = obra.nombreObra;
      }
    }

    this.aplicarFiltro();
  });
}

cargarSolicitudes() {
  this.service.getSolicitudes().subscribe(list => {

    this.solicitudes = list;

    this.aplicarFiltro(); // SIEMPRE filtrar

  });
}


aplicarFiltro() {
  const ud = this.auth.getUserData();

  const arr = this.solicitudes
    .filter(s =>
      (!this.filtroEstado || s.estado === this.filtroEstado) &&
      (this.esAdmin || s.obra === this.nueva.obra || s.obra === ud?.obraNombre) // filtrar por obra si no es admin
    )
    .sort((a, b) =>
      new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
    );

  this.filtradas = arr;
}

 agregarItem() {

  const existe = this.nueva.items.some(item => item.inventarioId === this.itemTemp.inventarioId);
  if (existe) {
    alert('Ya se agregó esta herramienta.');
    return;
  }

const herramienta = this.inventario.find(i => i.id === Number(this.itemTemp.inventarioId));
  if (!herramienta) {
    alert('Herramienta no válida.');
    return;
  }

  if (this.itemTemp.cantidad > herramienta.cantidad) {
    alert(`Solo hay ${herramienta.cantidad} disponibles.`);
    return;
  }

  this.nueva.items.push({ ...this.itemTemp });
  this.itemTemp = { inventarioId: 0, cantidad: 1 };
}

  eliminarItem(index: number) {
    this.nueva.items.splice(index, 1);
  }
  

  cambiarEstadoItem(item: SolicitudItem, estado: EstadoSolicitud) {

  if (!item.id) return;

  this.service.cambiarEstadoItem(item.id, estado).subscribe({

    next: () => {

      this.invService.obtenerInventario().subscribe(list => {

        this.inventario = list.filter(i =>
          i.ubicacion.toLowerCase() === 'picso central'
        );

        this.cargarSolicitudes();

      });

    },

    error: (err) => {

  const mensaje =
    typeof err.error === 'string'
      ? err.error
      : err.error?.message || 'Error de servidor';

  alert(mensaje);

}

  });

}

 crearSolicitud() {
  if (!this.nueva.obra || this.nueva.items.length === 0) {
    alert('Debe seleccionar una obra y al menos una herramienta.');
    return;
  }

  this.nueva.solicitante = this.usuarioActual;
  this.nueva.fechaSolicitud = new Date().toISOString();
  this.nueva.estado = EstadoSolicitud.Pendiente;
  this.service.crearSolicitud(this.nueva).subscribe({
    next: () => {
      const obraActual = this.nueva.obra;
        this.nueva = {
          solicitante: '',
          obra: obraActual,
          fechaSolicitud: new Date().toISOString(),
          observaciones: '',
          estado: EstadoSolicitud.Pendiente,
          items: []
        };
        this.cargarSolicitudes();
      },
      error: err => {
        console.error('❌ Error al crear solicitud:', err);
      }
    });
  }


 cambiarEstado(s: Solicitud, nuevo: EstadoSolicitud) {
  if (!s.id) return;

  this.service.cambiarEstado(s.id, nuevo).subscribe({
  next: () => {

    this.invService.obtenerInventario().subscribe(list => {
      this.inventario = list.filter(i =>
        i.ubicacion.toLowerCase() === 'picso central'
      );
    });

    this.cargarSolicitudes();

  },

 error: (err) => {

  const mensaje =
    typeof err.error === 'string'
      ? err.error
      : err.error?.message || 'Error de servidor';

  alert(mensaje);

}

});
}

 getHerramienta(id: number | string, mostrarCodigo = false): string {
    const it = this.inventario.find(x => x.id === Number(id));
    if (!it) return '(desconocida)';
    return mostrarCodigo ? `${it.codigo} - ${it.herramienta}` : it.herramienta;
  }


}
