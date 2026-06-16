import { Component, OnInit } from '@angular/core';
import { Contratista, ContratistaService } from '../../services/contratista.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { Obra, ObraService } from '../../services/obras.service';

@Component({
  selector: 'app-contratista',
  templateUrl: './contratista.component.html',
  styleUrls: ['./contratista.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent]
})
export class ContratistaComponent implements OnInit {
  contratistas: Contratista[] = [];
  contratistasFiltrados: Contratista[] = [];
  contratistaActual: Contratista = this.inicializarContratista();
  mostrarFormulario = false;
  esEdicion = false;
  searchQuery = '';
  obras: Obra[] = [];

  constructor(private contratistaService: ContratistaService, private obraService: ObraService) {}

  ngOnInit() {
    this.obtenerContratistas();
    this.obtenerObras();
  }

  inicializarContratista(): Contratista {
    return {
      id: 0,
      nombre: '',
      cedula: '',
      telefono: '',
      obraId: 0
    };
  }

  obtenerContratistas() {
    this.contratistaService.obtenerTodos().subscribe((data) => {
      this.contratistas = data;
      this.filtrarContratistas();
    });
  }

  obtenerObras() {
    this.obraService.getObras().subscribe(obras => {
      this.obras = obras;
    });
  }

  obtenerNombreObra(id: number): string {
    const obra = this.obras.find(o => o.id === id);
    return obra ? obra.nombreObra : 'Sin asignar';
  }

  filtrarContratistas() {
    const query = this.searchQuery.toLowerCase();
    this.contratistasFiltrados = this.contratistas.filter(c =>
      c.nombre.toLowerCase().includes(query) ||
      c.cedula.includes(query) ||
      c.telefono.includes(query)
    );
  }

  mostrarFormularioContratista(contratista?: Contratista) {
    this.mostrarFormulario = true;
    if (contratista) {
      this.contratistaActual = { ...contratista };
      this.esEdicion = true;
    } else {
      this.contratistaActual = this.inicializarContratista();
      this.esEdicion = false;
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.contratistaActual = this.inicializarContratista();
  }

  guardarContratista() {
    if (this.esEdicion) {
      this.contratistaService.actualizar(this.contratistaActual.id, this.contratistaActual).subscribe(() => {
        this.obtenerContratistas();
        this.cerrarFormulario();
      });
    } else {
      this.contratistaService.crear(this.contratistaActual).subscribe(() => {
        this.obtenerContratistas();
        this.cerrarFormulario();
      });
    }
  }

  eliminarContratista(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este contratista?')) {
      this.contratistaService.eliminar(id).subscribe(() => {
        this.obtenerContratistas();
      });
    }
  }
}
