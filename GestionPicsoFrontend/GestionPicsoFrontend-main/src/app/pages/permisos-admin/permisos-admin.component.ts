import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { TiempoAusentismo, AusentismoService } from '../../services/documento-permiso.service';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-permisos-admin',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FormsModule, BotonRegresarComponent],
  templateUrl: './permisos-admin.component.html',
  styleUrls: ['./permisos-admin.component.css']
})
export class PermisosAdminComponent implements OnInit {
  documentos: TiempoAusentismo[] = [];
  documentosFiltrados: TiempoAusentismo[] = [];
  documentoEditando: TiempoAusentismo | null = null;
  archivoSeleccionado: File | null = null;
  searchQuery: string = '';

  private ausentismoService = inject(AusentismoService);

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.ausentismoService.getDocumentos().subscribe({
      next: (data) => {
        this.documentos = data;
        this.documentosFiltrados = [...data];
      },
      error: (err) => {
        console.error("❌ Error al obtener documentos:", err);
      }
    });
  }

  filtrarPermisos(): void {
    const q = this.searchQuery.toLowerCase();
    this.documentosFiltrados = !q
      ? this.documentos
      : this.documentos.filter(doc =>
          doc.nombreEmpleado?.toLowerCase().includes(q) ||
          doc.comentarios?.toLowerCase().includes(q) ||
          doc.fechaInicio?.toLowerCase().includes(q) ||
          doc.fechaFin?.toLowerCase().includes(q)
        );
  }

  editar(documento: TiempoAusentismo): void {
    this.documentoEditando = { ...documento };
    this.archivoSeleccionado = null;
  }

  onArchivoSeleccionado(event: any): void {
    this.archivoSeleccionado = event.target.files[0] || null;
  }

  guardarCambios(): void {
    if (!this.documentoEditando?.id) return;

    if (this.archivoSeleccionado) {
      const formData = new FormData();
      formData.append('NombreEmpleado', this.documentoEditando.nombreEmpleado);
      formData.append('Comentarios', this.documentoEditando.comentarios || '');
      formData.append('FechaInicio', this.documentoEditando.fechaInicio);
      formData.append('FechaFin', this.documentoEditando.fechaFin);
      formData.append('Archivo', this.archivoSeleccionado);

      this.ausentismoService.subirDocumentoAusentismo(formData).subscribe({
        next: () => {
          this.documentoEditando = null;
          this.archivoSeleccionado = null;
          this.cargarDocumentos();
        },
        error: (err) => {
          console.error("❌ Error al subir nuevo archivo:", err);
        }
      });
    } else {
      const documentoActualizado: TiempoAusentismo = {
        ...this.documentoEditando,
        nombreArchivo: this.documentoEditando.nombreArchivo?.trim() || 'SinArchivo'
      };

      this.ausentismoService.actualizarDocumento(documentoActualizado.id, documentoActualizado).subscribe({
        next: () => {
          this.documentoEditando = null;
          this.cargarDocumentos();
        },
        error: (err) => {
          console.error("❌ Error al guardar cambios:", err);
        }
      });
    }
  }

  cancelarEdicion(): void {
    this.documentoEditando = null;
    this.archivoSeleccionado = null;
  }

  eliminar(id: number): void {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
      this.ausentismoService.eliminarDocumento(id).subscribe({
        next: () => this.cargarDocumentos(),
        error: (err) => console.error("❌ Error al eliminar documento:", err)
      });
    }
  }

  ver(documento: TiempoAusentismo): void {
    this.ausentismoService.verPDF(documento.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error("❌ Error al ver PDF:", err);
      }
    });
  }

  descargar(documento: TiempoAusentismo): void {
    if (!documento.nombreArchivo || documento.nombreArchivo === 'SinArchivo') return;

    this.ausentismoService.descargarPDF(documento.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.nombreArchivo!;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("❌ Error al descargar PDF:", err);
      }
    });
  }
}
