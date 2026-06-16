// src/app/crear-movimiento/crear-movimiento.component.ts
import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatSelectModule }      from '@angular/material/select';
import { MatButtonModule }      from '@angular/material/button';

import { MovimientoService, Movimiento } from '../services/movimiento-service.service';
import { InventarioService, Inventario } from '../services/inventario.service';
import { ObraService, Obra }             from '../services/obras.service';
import { UserService, User }             from '../services/user.service';

@Component({
  selector: 'app-crear-movimiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './crear-movimiento.component.html',
  styleUrls: ['./crear-movimiento.component.css']
})
export class CrearMovimientoComponent implements OnInit {
  @Output() movimientoCreado = new EventEmitter<Movimiento>();

  movimiento: Movimiento;
  herramientas: Inventario[] = [];
  obras: Obra[] = [];
  responsables: User[] = [];

  private movimientoService   = inject(MovimientoService);
  private inventarioService   = inject(InventarioService);
  private obraService         = inject(ObraService);
  private userService         = inject(UserService);
  private dialogRef           = inject(MatDialogRef<CrearMovimientoComponent>);
  private data                = inject<Movimiento|null>(MAT_DIALOG_DATA, { optional: true });

  constructor() {
    // Inicializas el objeto movimiento: si te pasaron data (edición), la usas; si no, valores por defecto
    this.movimiento = this.data ? { ...this.data } : {
      inventarioId: 0,
      codigoHerramienta: '',
      nombreHerramienta: '',
      responsable: '',
      obra: '',
      // Fecha en formato compatible con datetime-local
      fechaMovimiento: new Date().toISOString().slice(0,16),
      tipoMovimiento: '',
      estado: '',
      cantidad :1,
      comentario: ''
    };
  }

  ngOnInit() {
    // cargo inventario completo para el select de herramientas
    this.inventarioService.obtenerInventario().subscribe(arr => {
      this.herramientas = arr;
    });
    // cargo obras
    this.obraService.getObras().subscribe(o => this.obras = o);
    // cargo solo usuarios con rol 'responsable'
    this.userService.getAllUsers().subscribe(u => {
      this.responsables = u.filter(x => x.rol === 'responsable');
    });
  }

  onHerramientaChange(inventarioId: number) {
    const h = this.herramientas.find(x => x.id === inventarioId);
    if (h) {
      this.movimiento.codigoHerramienta = h.codigo;
      this.movimiento.nombreHerramienta = h.herramienta;
    }
  }

  crearMovimiento(): void {
    this.movimientoService.crearMovimiento(this.movimiento).subscribe(
      m => {
        this.movimientoCreado.emit(m);
        this.dialogRef.close();
      },
      err => console.error('Error al crear movimiento:', err)
    );
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
