import { Component } from '@angular/core';
import { PruebasHermeticidadService } from '../../services/pruebas-hermeticidad.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BotonRegresarComponent } from "../../boton-regresar/boton-regresar.component";
import { ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from "../../navbar/navbar.component";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-pruebas-hermeticidad',
  templateUrl: './pruebas-hermeticidad.component.html',
  styleUrls: ['./pruebas-hermeticidad.component.css'],
  standalone:true,
  imports: [FormsModule, CommonModule, BotonRegresarComponent, NavbarComponent]
  
})
export class PruebasHermeticidadComponent {

  @ViewChild('canvasContratista') canvasContratista!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasConstructor') canvasConstructor!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private ctxContratista!: CanvasRenderingContext2D;
  private ctxConstructor!: CanvasRenderingContext2D;

  private dibujandoContratista = false;
  private dibujandoConstructor = false;

  form: any = {
    proyecto: '',
    cliente: '',
    tipoPrueba: '',
    descripcion: '',
    descripcionPrueba: '',
    inicioPrueba: '',
  };

  formFinalizar: any = {
  finPrueba: '',
  cumple: '',
  descripcion: ''
  };

  imagenFinal!: File;
  previewFinal: string | ArrayBuffer | null = null;
  menuAbiertoId: number | null = null;

  pruebas: any[] = [];
  imagenInicio!: File;
  previewInicio: string | ArrayBuffer | null = null;
  modalAbierto = false;
  pruebaSeleccionada: any = null;
  cargando = false;
  obraId: number | null = null;  

  constructor(private service: PruebasHermeticidadService,private router: Router,private route: ActivatedRoute) {}

  ngOnInit() {
  this.obraId = Number(this.route.snapshot.queryParamMap.get('obraId'));
  this.cargarPruebas();
  }

//redireccion a ver prueba
  verPrueba(id: number) {
  this.router.navigate(['/pruebas-hermeticidad', id]);
  }

//redireccion a editar prueba
  editarPrueba(id: number) {
  this.router.navigate(['/pruebas-hermeticidad', id], {
    queryParams: { edit: true }
  });
  }
  
//cargar pruebas al abrir modal
  cargarPruebas() {
  if (this.obraId) {
    this.service.obtenerPorObra(this.obraId).subscribe({
      next: (data) => this.pruebas = data,
      error: (err) => console.error(err)
    });
  } else {
    // admin o fallback
    this.service.obtenerPruebas().subscribe({
      next: (data) => this.pruebas = data,
      error: (err) => console.error(err)
    });
  }
  }

  // 📸 capturar imagen + preview Imageninicio
  onFileChange(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.imagenInicio = file;

      const reader = new FileReader();
      reader.onload = () => this.previewInicio = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // 🚀 guardar prueba (INICIO)
  guardar() {
    if (!this.form.cliente || !this.form.inicioPrueba) {
      alert('Faltan campos obligatorios');
      return;
    }

    const formData = new FormData();

    formData.append('proyecto', this.form.proyecto);
    formData.append('cliente', this.form.cliente);
    formData.append('tipoPrueba', this.form.tipoPrueba);
    formData.append('descripcion', this.form.descripcion);
    formData.append('descripcionPrueba', this.form.descripcionPrueba);
    formData.append('inicioPrueba', this.form.inicioPrueba);
    formData.append('presionInicial', this.form.presionInicial);
    formData.append('obraId', this.obraId!.toString());

    if (this.imagenInicio) {
      formData.append('imagenInicio', this.imagenInicio);
    }

    this.cargando = true;

    this.service.crearPrueba(formData).subscribe({
      next: () => {
        alert('✅ Prueba iniciada correctamente');
        this.resetForm();

        this.cargarPruebas();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al guardar');
      },
      complete: () => this.cargando = false
    });
  }

  //limpiar formulario despues de guardar
  resetForm() {
  this.form = {
    proyecto: '',
    cliente: '',
    tipoPrueba: 'Hermeticidad',
    descripcion: '',
    descripcionPrueba: '',
    inicioPrueba: '',
    imagenInicio: ''
  };

  this.previewInicio = null;
  this.imagenInicio = undefined!;

  // 🔥 limpiar input file
  if (this.fileInput) {
    this.fileInput.nativeElement.value = '';
  }
  }

  //metodo finalizar prueba boton
  finalizarPrueba() {
  if (!this.formFinalizar.finPrueba || !this.formFinalizar.cumple) {
    alert('Faltan datos');
    return;
  }

  const formData = new FormData();

  const firmaContratistaBase64 = this.canvasContratista.nativeElement
    .toDataURL('image/png')
    .split(',')[1];

  const firmaConstructorBase64 = this.canvasConstructor.nativeElement
    .toDataURL('image/png')
    .split(',')[1];

  formData.append('firmaContratista', firmaContratistaBase64);
  formData.append('firmaConstructor', firmaConstructorBase64);
  formData.append('finPrueba', this.formFinalizar.finPrueba);
  formData.append('cumple', this.formFinalizar.cumple);
  formData.append('presionFinal', this.formFinalizar.presionFinal);
  formData.append('descripcion', this.formFinalizar.descripcion);
  

  if (this.imagenFinal) {
    formData.append('imagenFinal', this.imagenFinal);
  }

  this.service.finalizarPrueba(this.pruebaSeleccionada.id, formData)
    .subscribe({
      next: () => {
        alert('✅ Prueba finalizada');
        this.cerrarModal();
        this.cargarPruebas();
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al finalizar');
      }
    });
  }

  //abrir modal al darle a finalizar la prueba
  abrirModal(prueba: any) {
  this.pruebaSeleccionada = prueba;
  this.modalAbierto = true;

  this.formFinalizar = {
    finPrueba: '',
    cumple: '',
    descripcion: '',
    presionFinal: ''
  };

  this.previewFinal = null;

  // 🔥 esperar a que el DOM pinte el canvas
  setTimeout(() => {
  this.inicializarCanvas(this.canvasContratista, 'contratista');
  this.inicializarCanvas(this.canvasConstructor, 'constructor');
  }, 100);
  }

  cerrarModal() {
  this.modalAbierto = false;

  this.formFinalizar = {
    finPrueba: '',
    cumple: '',
    descripcion: '',
    presionFinal: ''
  };
  }

  //subir imagen del final de la prueba
  onFileChangeFinal(event: any) {
  const file = event.target.files[0];

  if (file) {
    this.imagenFinal = file;

    const reader = new FileReader();
    reader.onload = () => this.previewFinal = reader.result;
    reader.readAsDataURL(file);
  }
  }

  inicializarCanvas(canvasRef: ElementRef, tipo: 'contratista' | 'constructor') {
  const canvas = canvasRef.nativeElement;
  const ctx = canvas.getContext('2d')!;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  if (tipo === 'contratista') this.ctxContratista = ctx;
  else this.ctxConstructor = ctx;

  canvas.addEventListener('mousedown', (e: MouseEvent) => this.startDraw(tipo, e));
  canvas.addEventListener('mouseup', () => this.stopDraw(tipo));
  canvas.addEventListener('mousemove', (e: MouseEvent) => this.draw(e, canvas, tipo));

  canvas.addEventListener('touchstart', (e: TouchEvent) => this.startDraw(tipo, e));
  canvas.addEventListener('touchend', () => this.stopDraw(tipo));
  canvas.addEventListener('touchmove', (e: TouchEvent) => this.drawTouch(e, canvas, tipo));
}

  //empezar a dibujar en el canva de firma
  startDraw(tipo: 'contratista' | 'constructor', event?: MouseEvent | TouchEvent) {
  let x = 0;
  let y = 0;

  const canvas =
    tipo === 'contratista'
      ? this.canvasContratista.nativeElement
      : this.canvasConstructor.nativeElement;

  const rect = canvas.getBoundingClientRect();

  if (event instanceof MouseEvent) {
    x = event.clientX - rect.left;
    y = event.clientY - rect.top;
  }

  if (event instanceof TouchEvent) {
    const touch = event.touches[0];
    x = touch.clientX - rect.left;
    y = touch.clientY - rect.top;
  }

  if (tipo === 'contratista') {
    this.dibujandoContratista = true;
    this.ctxContratista.beginPath();
    this.ctxContratista.moveTo(x, y);
  } else {
    this.dibujandoConstructor = true;
    this.ctxConstructor.beginPath();
    this.ctxConstructor.moveTo(x, y);
  }
}

 stopDraw(tipo: 'contratista' | 'constructor') {
  if (tipo === 'contratista') {
    this.dibujandoContratista = false;
    this.ctxContratista.beginPath();
  } else {
    this.dibujandoConstructor = false;
    this.ctxConstructor.beginPath();
  }
}

  draw(event: MouseEvent, canvas: HTMLCanvasElement, tipo: 'contratista' | 'constructor') {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const ctx = tipo === 'contratista' ? this.ctxContratista : this.ctxConstructor;
  const dibujando = tipo === 'contratista' ? this.dibujandoContratista : this.dibujandoConstructor;

  if (!dibujando) return;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

  drawTouch(event: TouchEvent, canvas: HTMLCanvasElement, tipo: 'contratista' | 'constructor') {
  event.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0];

  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  const ctx = tipo === 'contratista' ? this.ctxContratista : this.ctxConstructor;
  const dibujando = tipo === 'contratista' ? this.dibujandoContratista : this.dibujandoConstructor;

  if (!dibujando) return;

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
}

 limpiarFirma(tipo: 'contratista' | 'constructor') {
  const canvas =
    tipo === 'contratista'
      ? this.canvasContratista.nativeElement
      : this.canvasConstructor.nativeElement;

  const ctx =
    tipo === 'contratista'
      ? this.ctxContratista
      : this.ctxConstructor;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

  eliminarPrueba(id: number) {
  if (!confirm('¿Seguro que quieres eliminar esta prueba?')) return;

  this.service.eliminarPrueba(id).subscribe({
    next: () => {
      this.pruebas = this.pruebas.filter(p => p.id !== id);
      alert('🗑 Prueba eliminada');
    },
    error: (err) => {
      console.error(err);
      alert('❌ Error eliminando prueba');
    }
  });
  }

  toggleMenu(id: number) {
  this.menuAbiertoId = this.menuAbiertoId === id ? null : id;
  }

  descargarPdf(id: number) {
  this.service.descargarPdf(id).subscribe(blob => {

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Prueba_${id}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);

    this.menuAbiertoId = null; // 🔥 cerrar menú
  });
  }
}






