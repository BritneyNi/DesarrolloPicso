import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { RevisionInventarioService, RevisionInventario } from '../../services/revision-inventario.service';
import { AuthService } from '../../services/auth.service';
import { InventarioService, Inventario } from '../../services/inventario.service';

@Component({
  selector: 'app-revision-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './revision-inventario.component.html',
  styleUrls: ['./revision-inventario.component.css']
})
export class RevisionInventarioComponent implements OnInit {
  materiales: Inventario[] = [];
  materialesFiltrados: Inventario[] = [];

  revisionesPorItem: { [key: number]: RevisionInventario[] } = {};
  revisionesVisibles: { [key: number]: boolean } = {};

  revisionActual: Partial<RevisionInventario> = this.resetRevision();
  mostrarModalRevision = false;

  obraUsuario: string | null = null;
  responsable: string = '';
  rol: string = '';

  searchQuery = '';
  currentPage = 1;
  pageSize = 15;

  private inventarioService = inject(InventarioService);
  private revisionService = inject(RevisionInventarioService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const user = this.authService.getUserData();
    this.responsable =
      user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || user?.name || '';
    this.rol =
      user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || user?.rol || '';

    this.cargarInventario();
  }

  cargarInventario(): void {
    this.inventarioService.obtenerInventario().subscribe({
      next: data => {
       this.materiales = data.sort((a, b) => Number(a.codigo) - Number(b.codigo));
        this.filtrarMateriales();
      },
      error: err => console.error('Error cargando inventario ▶', err)
    });
  }

  filtrarMateriales(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.materialesFiltrados = this.materiales.filter(item =>
      item.codigo.toLowerCase().includes(q) ||
      item.herramienta.toLowerCase().includes(q) ||
      item.marca.toLowerCase().includes(q) ||
      (item.numeroSerie || '').toLowerCase().includes(q) ||
      item.ubicacion.toLowerCase().includes(q) ||
      item.responsable.toLowerCase().includes(q)
    );
    this.setPage(1);
  }

  toggleRevisiones(inventarioId: number): void {
    this.revisionesVisibles[inventarioId] = !this.revisionesVisibles[inventarioId];

    if (this.revisionesVisibles[inventarioId] && !this.revisionesPorItem[inventarioId]) {
      this.cargarRevisionesParaItem(inventarioId);
    }
  }

  cargarRevisionesParaItem(inventarioId: number): void {
    this.revisionService.obtenerPorInventarioId(inventarioId).subscribe({
      next: data => {
        this.revisionesPorItem[inventarioId] = data
        .sort((a, b) => {
          const fechaA = a.fechaRevision ?? '';
          const fechaB = b.fechaRevision ?? '';
          return fechaB.localeCompare(fechaA);
        })
          .slice(0, 3);
      },
      error: err => console.error(`Error obteniendo revisiones del item ${inventarioId} ▶`, err)
    });
  }

  abrirModalRevision(material: Inventario): void {
    this.revisionActual = {
      ...this.resetRevision(),
      inventarioId: material.id
    };
    this.mostrarModalRevision = true;
  }

  cerrarModalRevision(): void {
    this.mostrarModalRevision = false;
  }

 guardarRevision(): void {
  if (!this.revisionActual.estadoFisico || !this.revisionActual.inventarioId) return;

  const nueva = {
    inventarioId: this.revisionActual.inventarioId,
    responsable: this.responsable,
    encontrado: true,
    estadoFisico: this.revisionActual.estadoFisico.trim(),
    observaciones: (this.revisionActual.observaciones || '').trim()
  };

  console.log('Datos enviados realmente:', JSON.stringify(nueva));

  this.revisionService.agregarRevision(nueva).subscribe({
    next: () => {
      this.cerrarModalRevision();
      this.cargarRevisionesParaItem(nueva.inventarioId);
    },
    error: err => console.error('Error guardando revisión ▶', err)
  });
}

eliminarRevision(rev: RevisionInventario, inventarioId: number): void {
  if (!confirm('¿Seguro que deseas eliminar esta revisión?')) return;

  if (!rev.id) return;

  this.revisionService.eliminarRevision(rev.id).subscribe({
    next: () => {
      // quitarla del array local sin volver a pegarle al backend
      this.revisionesPorItem[inventarioId] =
      this.revisionesPorItem[inventarioId].filter(r => r.id !== rev.id);
      alert('Revision eliminada exitosamente');
    },
    error: err => console.error('Error eliminando revisión ▶', err)
  });
}


  get pages(): number[] {
    return Array.from(
      { length: Math.ceil(this.materialesFiltrados.length / this.pageSize) },
      (_, i) => i + 1
    );
  }

  setPage(p: number): void {
    this.currentPage = p;
  }

  puedeRevisar(): boolean {
    return this.rol === 'admin' || this.rol === 'responsable';
  }

  private resetRevision(): Partial<RevisionInventario> {
    return {
      estadoFisico: '',
      observaciones: ''
    };
  }
}
