import { Component, OnInit,HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { ElementoEppService, ElementoEpp } from '../../services/elemento-epp.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';
import { ElementoEppInventarioService,InventarioGeneral } from '../../services/elemento-epp-inventario.service';

@Component({
  selector: 'app-dotacion',
  standalone:true,
  templateUrl: './dotacion.component.html',
  styleUrls: ['./dotacion.component.css'],
  imports: [NavbarComponent,CommonModule,ReactiveFormsModule,BotonRegresarComponent]
})

export class DotacionComponent implements OnInit {

  selectedFile: File | null = null;
  editarId: number | null = null;
  elementos: ElementoEpp[] = [];
  mostrarModal = false;
  form!: FormGroup;

  @HostListener('document:keydown.escape')
  onEscape() {
  if (this.mostrarModal) {
    this.cerrarModal();
  }
}

  constructor(
    private eppService: ElementoEppService,
    private inventarioService: ElementoEppInventarioService,
    private fb: FormBuilder,
    private router : Router
  
  ) {}

  ngOnInit(): void {
    
    this.cargarElementos();

   this.form = this.fb.group({
    nombre: ['', Validators.required],
    tipo: ['EPP', Validators.required],
    descripcion: [''],
    vidaUtilMeses: [null],
    requiereEvidencia: [false]
  });
}

  irAInventario(elementoId: number) {
    this.router.navigate(['/inventario', elementoId]);
}

  irAEntregas() {
  this.router.navigate(['/entregas']);
}
  
  verHistorial() {
    this.router.navigate(['/historial-entregas']);
}

  irInventarioGeneral() {
  this.router.navigate(['/inventario-general']);
}


  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    this.selectedFile = input.files[0];
  } else {
    this.selectedFile = null;
  }
}
 cargarElementos() {
  this.eppService.getAll().subscribe(data => {
    this.elementos = data;
  });
}

  abrirModal() {
    this.editarId = null;
    this.form.reset({
      tipo: 'EPP',
      requiereEvidencia: false
    });
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editarId = null;
    this.selectedFile = null;
  }

guardar() {
 if (this.form.invalid) return;

  const formValues = this.form.value;
  const formData = new FormData();

  for (const key in formValues) {
    const value = formValues[key];

    if (key === 'descripcion') {
      if (value && value.trim() !== '') {
        formData.append(key, value);
      }
      // si está vacío o null → NO se manda
    } else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  }

  // si hay archivo, agregarlo
  if (this.selectedFile) {
    formData.append('evidencia', this.selectedFile);
  }

  if (this.editarId) {
  formData.append('id', this.editarId.toString());
  this.eppService.updateWithFile(this.editarId, formData).subscribe({
    next: () => {
      alert('Elemento actualizado correctamente ✏️');
      this.cerrarModal();
      this.editarId = null;
      this.cargarElementos();
    },
    error: (err) => {
      console.error('Error editando elemento con evidencia', err);
      alert('No se pudo actualizar el elemento');
    }
  });
} else {
  this.eppService.createWithFile(formData).subscribe({
    next: () => {
      alert('Elemento creado correctamente ✅');
      this.cerrarModal();
      this.cargarElementos();
    },
    error: (err) => {
      console.error('Error creando elemento con evidencia', err);
      alert('No se pudo crear el elemento');
    }
  });
}

}
  eliminarElemento(id: number) {
  if (!confirm('¿Seguro que quieres eliminar este elemento?')) return;

  this.eppService.delete(id).subscribe({
    next: () => {
      alert('Elemento eliminado correctamente 🗑️');
      // recargar tabla después de eliminar
      this.cargarElementos();
    },
    error: (err) => {
      console.error('Error eliminando elemento', err);
      alert('No se pudo eliminar el elemento porque tiene movimientos de entrega realizados');
    }
  });
}

editarElemento(id: number) {
  this.selectedFile = null;
  // obtenemos los datos del elemento por ID
  this.eppService.getById(id).subscribe({
    next: (elemento) => {
      // rellenamos el formulario con los datos existentes
      this.form.patchValue({
        nombre: elemento.nombre,
        tipo: elemento.tipo,
        descripcion: elemento.descripcion,
        vidaUtilMeses: elemento.vidaUtilMeses,
        requiereEvidencia: elemento.requiereEvidencia
      });

      // guardamos el ID del elemento que estamos editando
      this.editarId = id;

      // abrimos el modal
      this.mostrarModal = true;
    },
    error: (err) => {
      console.error('Error cargando elemento', err);
      alert('No se pudo cargar el elemento');
    }
  });
}


}


