import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CrearMovimientoComponent } from '../../crear-movimiento/crear-movimiento.component';
import { MovimientoService, Movimiento } from '../../services/movimiento-service.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-movimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    NavbarComponent,
    BotonRegresarComponent
],
  templateUrl: './movimiento-component.html',
  styleUrls: ['./movimiento-component.css']
})
export class MovimientoComponent implements OnInit {
  movimientos: Movimiento[] = [];
  movimientosFiltrados: Movimiento[] = [];
  searchQuery = '';

  private movimientoService = inject(MovimientoService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.obtenerMovimientos();
  }

  obtenerMovimientos(): void {
    this.movimientoService.getMovimientos().subscribe({
      next: data => {
        this.movimientos = data;
        this.movimientosFiltrados = [...data];  
      },
      error: err => console.error('Error al obtener movimientos:', err)
    });
  }

  filtrarMovimientos(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.movimientosFiltrados = [...this.movimientos];
    } else {
      this.movimientosFiltrados = this.movimientos.filter(m =>
        m.nombreHerramienta.toLowerCase().includes(q) ||
        m.responsable.toLowerCase().includes(q) ||
        m.tipoMovimiento.toLowerCase().includes(q) ||
        m.estado.toLowerCase().includes(q) ||
        m.fechaMovimiento.toLowerCase().includes(q)
      );
    }
  }

  abrirCrearMovimiento(mov?: Movimiento): void {
    const ref = this.dialog.open(CrearMovimientoComponent, {
      width: '650px',
      data: mov ?? null
    });
    ref.afterClosed().subscribe(() => this.obtenerMovimientos());
  }
}
