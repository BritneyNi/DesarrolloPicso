import { Component, OnInit } from '@angular/core';
import { NotificacionesService } from '../../services/notificaciones.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { NavbarComponent } from "../../navbar/navbar.component";

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, BotonRegresarComponent, NavbarComponent],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit {
  notificaciones: any[] = [];
  notificacionesAgrupadas: { [tipo: string]: any[] } = {};
  gruposColapsados: { [tipo: string]: boolean } = {};

  constructor(private notiService: NotificacionesService, private router: Router) {}

  ngOnInit(): void {
    this.notiService.getActivas().subscribe(data => {
      this.notificaciones = data;
      this.notificacionesAgrupadas = this.agruparPorTipo(data);
      this.notiService.marcarComoLeidas().subscribe(() => {
        this.notiService.ultimoCount = 0;
      });
    });
  }

  irDesdeNotificacion(n: any) {
    switch (n.tipo) {
      case 'Afiliacion':
        this.router.navigate(['/empleado-admin'], { queryParams: { empleado: n.referenciaId, tab: 'afiliaciones' } });
        break;
      case 'Contrato':
      case 'ContratoSinRegistrar':
        this.router.navigate(['/empleado-admin'], { queryParams: { empleado: n.referenciaId, tab: 'contrato' } });
        break;
      case 'ContratoFirma':
        this.router.navigate(['/empleado-admin'], { queryParams: { empleado: n.referenciaId, tab: 'firmaContrato' } });
        break;
      case 'Dotacion':
        this.router.navigate(['/entregas'], { queryParams: { empleado: n.referenciaId } });
        break;
      case 'Alturas':
        this.router.navigate(['/rrhh/alturas'], { queryParams: { empleado: n.referenciaId } });
        break;
      case 'ExamenIngreso':
        this.router.navigate(['/empleado-admin'], { queryParams: { empleado: n.referenciaId, tab: 'examen' } });
        break;
      case 'Cumpleanos':
        this.router.navigate(['/empleado-admin'], { queryParams: { empleado: n.referenciaId, tab: 'info' } });
        break;
    }
  }

  agruparPorTipo(lista: any[]) {
    return lista.reduce((acc, n) => {
      if (!acc[n.tipo]) acc[n.tipo] = [];
      acc[n.tipo].push(n);
      return acc;
    }, {} as { [tipo: string]: any[] });
  }

  obtenerIcono(grupo: string) {
    if (grupo.includes('Cumple')) return '🎂';
    if (grupo.includes('Altura')) return '🧗';
    if (grupo.includes('Examen')) return '🩺';
    if (grupo.includes('Documento')) return '📄';
    return '🔔';
  }

  obtenerColorClase(grupo: string) {
    if (grupo.includes('Cumple')) return 'cumpleanos';
    if (grupo.includes('Altura')) return 'alturas';
    if (grupo.includes('Examen')) return 'examen';
    if (grupo.includes('Documento')) return 'documento';
    return '';
  }

  toggleGrupo(tipo: string) {
    this.gruposColapsados[tipo] = !this.gruposColapsados[tipo];
  }

  estaColapsado(tipo: string) {
    return this.gruposColapsados[tipo];
  }
}