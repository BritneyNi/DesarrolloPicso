import { Component, OnInit, inject,HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ObraService, Obra } from '../../services/obras.service';
import { NavbarComponent } from '../../navbar/navbar.component';
import { BotonRegresarComponent } from '../../boton-regresar/boton-regresar.component';

@Component({
  selector: 'app-usuarios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BotonRegresarComponent],
  templateUrl: './usuarios-admin.component.html',
  styleUrls: ['./usuarios-admin.component.css']
})
export class UsuariosAdminComponent implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  obras: Obra[] = [];
  searchQuery: string = '';
  mensajeCargo = '';
  mensajeNombre = '';
  mensajeCedula = '';
  mensajePassword = '';
  mensajeErrorGeneral: string = '';
  mostrarFormulario: boolean = false;
  esEdicion: boolean = false;
  usuarioActual: any = {
    id: 0,
    cedula: '',
    nombreCompleto: '',
    cargo: '',
    obraId: null,
    rol: '',
    estado: 'activo',
    contrasena: '',
    tipoResponsabilidad: 'Principal',
    
  };

  estadoFiltro: 'Activo' | 'Inactivo' | 'Todos' = 'Activo';
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.mostrarFormulario) {
      this.cerrarFormulario();
    }
  }


  private userService = inject(UserService);
  private obraService = inject(ObraService);

  ngOnInit(): void {
    this.cargarObras();
    this.cargarUsuarios();
  }
  
 // Para filtro por estado
filtrarPorEstado(filtro: 'Activo' | 'Inactivo' | 'Todos') {
  this.estadoFiltro = filtro;
  this.aplicarFiltros();
}
filtrarPorTexto() {
  this.aplicarFiltros();
}


  // Método que combina ambos filtros
aplicarFiltros() {
  this.usuariosFiltrados = this.usuarios.filter(u => {
    const cumpleEstado = this.estadoFiltro === 'Todos' || u.estado === this.estadoFiltro;
    const cumpleBusqueda = !this.searchQuery || u.nombreCompleto.toLowerCase().includes(this.searchQuery.toLowerCase()) 
                          || u.rol.toLowerCase().includes(this.searchQuery.toLowerCase())
                          || u.cedula.toLowerCase().includes(this.searchQuery.toLowerCase())
                          || u.cargo.toLowerCase().includes(this.searchQuery.toLowerCase())
                          || (u.obra?.nombreObra.toLowerCase().includes(this.searchQuery.toLowerCase()));
    return cumpleEstado && cumpleBusqueda;
  });
}

filtrarUsuarios(filtro: 'Activo' | 'Inactivo' | 'Todos' = 'Todos'): void {
  this.estadoFiltro = filtro;

  this.usuariosFiltrados = this.usuarios.filter(u => {
    const coincideEstado = filtro === 'Todos' || u.estado === filtro;
    const coincideBusqueda = !this.searchQuery || 
      (u.nombreCompleto?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
       u.rol?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
       u.cedula?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
       u.cargo?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
       this.obtenerNombreObraPorId(u.obraId)?.toLowerCase().includes(this.searchQuery.toLowerCase()));
    return coincideEstado && coincideBusqueda;
  });
}



  cargarUsuarios(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
         // Normalizamos estado y agregamos la obra
        this.usuarios = data.map(usuario => ({
          ...usuario,
          obra: this.obras.find(o => o.id === usuario.obraId) || null,
          // Normaliza mayúsculas/minúsculas
          estado: usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1).toLowerCase()
        }));
       this.filtrarUsuarios(this.estadoFiltro);
      },
      error: (err) => console.error('❌ Error al obtener usuarios:', err)
    });
  }

  cargarObras(): void {
    this.obraService.getObras().subscribe({
      next: (data) => {
        this.obras = data;
        this.cargarUsuarios();
      },
      error: (err) => console.error('❌ Error al obtener obras:', err)
    });
  }

  obtenerNombreObraPorId(id: number): string {
    const obra = this.obras.find(o => o.id === id);
    return obra ? obra.nombreObra : '---';
  }

  mostrarFormularioUsuario(usuario: any = null): void {
  this.mostrarFormulario = true;
  setTimeout(() => {
    const modal = document.querySelector('.modal');
    if (modal) {
      modal.classList.add('fade-in');
      modal.classList.remove('fade-out');
    }
  });

  this.esEdicion = usuario !== null;

  if (usuario) {
    this.usuarioActual = {
      ...usuario,
      contrasena: '',
      tipoResponsabilidad: 'Principal'
    };
  } else {
    this.usuarioActual = {
      id: 0,
      cedula: '',
      nombreCompleto: '',
      cargo: '',
      obraId: null,
      rol: '',
      estado: 'activo',
      contrasena: ''
    };
  }
}

 cerrarFormulario(): void {
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.classList.remove('fade-in');
    modal.classList.add('fade-out');

    setTimeout(() => {
      this.mostrarFormulario = false;
      this.usuarioActual = {
        id: 0,
        cedula: '',
        nombreCompleto: '',
        cargo: '',
        obraId: null,
        rol: '',
        estado: 'activo',
        contrasena: ''
      };
    }, 300); // tiempo igual al de la animación CSS
  } else {
    // fallback por si no hay animación
    this.mostrarFormulario = false;
  }
}

guardarUsuario(): void {
  // ✅ Reinicia mensaje de error
  this.mensajeErrorGeneral = '';

  // ⚠️ Validación: todos los campos obligatorios
  if (
    !this.usuarioActual.cedula ||
    !this.usuarioActual.nombreCompleto ||
    !this.usuarioActual.cargo ||
    (this.usuarioActual.rol === 'responsable' && !this.usuarioActual.obraId) ||
    !this.usuarioActual.rol ||
    (!this.esEdicion && !this.usuarioActual.contrasena)
  ) {
    this.mensajeErrorGeneral = '⚠️ Todos los campos son obligatorios.';
    return;
  }
  // ✅ Verificar si ya existe una cédula registrada
    const cedulaExistente = this.usuarios.some(
      u => u.cedula.trim() === this.usuarioActual.cedula.trim() && u.id !== this.usuarioActual.id
    );

    if (cedulaExistente) {
      alert('⚠️ Admin Picso dice:\n\nYa existe un usuario registrado con esta cédula.');
      return;
    }
  // ✅ Validación: cédula mínima de 8 caracteres
    if (this.usuarioActual.cedula.trim().length < 8) {
      alert('La cédula debe tener al menos 8 caracteres.');
      return;
    }
  const usuarioParaEnviar: any = {
    id: this.esEdicion ? this.usuarioActual.id : 0,
    cedula: this.usuarioActual.cedula,
    nombreCompleto: this.usuarioActual.nombreCompleto,
    cargo: this.usuarioActual.cargo,
    obraId: this.usuarioActual.obraId,
    rol: this.usuarioActual.rol,
    estado: this.usuarioActual.estado || 'activo',
    tipoResponsabilidad: this.usuarioActual.tipoResponsabilidad
  };

  if (!this.esEdicion || this.usuarioActual.contrasena) {
    usuarioParaEnviar.contrasenaHash = this.usuarioActual.contrasena;
  }

  if (this.esEdicion) {
    this.userService.updateUser(usuarioParaEnviar.id, usuarioParaEnviar).subscribe({
      next: () => {
        alert('✅ Usuario actualizado correctamente');
        this.cargarUsuarios();
        this.mostrarFormulario = false;
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        this.mensajeErrorGeneral = 'Error al actualizar usuario. Intenta nuevamente.';
      }
    });
  } else {
    this.userService.createUser(usuarioParaEnviar).subscribe({
      next: () => {
        alert('✅ Usuario agregado correctamente');
        this.cargarUsuarios();
        this.mostrarFormulario = false;
      },
      error: (error) => {
        console.error('❌ Error al agregar usuario:', error);
        this.mensajeErrorGeneral = 'Error al agregar usuario. Intenta nuevamente.';
      }
    });
  }
}

validarCedula(event: KeyboardEvent): void {
  const input = event.key;
  const valorActual = this.usuarioActual.cedula || '';

  // Permitir teclas de control
  if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(input)) {
    return;
  }

  this.mensajeCedula = ''; // limpiar mensaje

  // Contar letras y verificar si ya tiene ":"
  const letrasActuales = (valorActual.match(/[a-zA-Z]/g) || []).length;
  const tieneDosPuntos = valorActual.includes(':');

  // --- 🔤 Máximo 5 letras ---
  if (/[a-zA-Z]/.test(input)) {
    if (letrasActuales >= 5) {
      event.preventDefault();
      this.mensajeCedula = 'Solo se permiten hasta 5 letras.';
    }
    return;
  }

  // --- 🔢 Números permitidos ---
  if (/[0-9]/.test(input)) {
    return;
  }

  // --- ⚙️ Solo un ":" permitido ---
  if (input === ':') {
    if (tieneDosPuntos) {
      event.preventDefault();
      this.mensajeCedula = 'Solo se permite un ":" en la cédula.';
    }
    return;
  }

  // ❌ Cualquier otro carácter bloqueado
  event.preventDefault();
  this.mensajeCedula = 'Solo se permiten letras (máx. 5), números y un ":"';
}

bloquearPegado(event: ClipboardEvent): void {
  event.preventDefault();
  this.mensajeCedula = 'No se permite pegar texto en este campo.';
}

validarNombre(event: KeyboardEvent): void {
  const input = event.key;
  const valorActual = this.usuarioActual.nombreCompleto || '';

  // ✅ Permitir teclas de control
  if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(input)) {
    return;
  }

  this.mensajeNombre = '';

  const espaciosActuales = (valorActual.match(/ /g) || []).length;

  // --- 🔠 Solo letras ---
  if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]$/.test(input)) {

    // --- Limitar espacios ---
    if (input === ' ') {
      if (espaciosActuales >= 3) {
        event.preventDefault();
        this.mensajeNombre = 'Máximo 3 espacios permitidos.';
        this.ocultarMensajeNombre();
      }
      return;
    }

    return; // letra válida
  }

  // ❌ Bloquear todo lo demás (números, símbolos, etc.)
  event.preventDefault();
  this.mensajeNombre = 'Solo se permiten letras y máximo 3 espacios.';
  this.ocultarMensajeNombre();
}

// 🕒 Borra mensaje automático a los 3 segundos
ocultarMensajeNombre(): void {
  setTimeout(() => (this.mensajeNombre = ''), 3000);
}

validarCargo(event: KeyboardEvent): void {
  const input = event.key;
  const valorActual = this.usuarioActual.cargo || '';

  // ✅ Permitir teclas de control
  if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(input)) {
    return;
  }

  this.mensajeCargo = '';

  const espaciosActuales = (valorActual.match(/ /g) || []).length;

  // --- 🔠 Solo letras ---
  if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]$/.test(input)) {
    if (input === ' ') {
      if (espaciosActuales >= 3) {
        event.preventDefault();
        this.mensajeCargo = 'Máximo 3 espacios permitidos.';
        this.ocultarMensajeCargo();
      }
      return;
    }
    return; // letra válida
  }

  // ❌ Bloquear todo lo demás
  event.preventDefault();
  this.mensajeCargo = 'Solo se permiten letras y máximo 3 espacios.';
  this.ocultarMensajeCargo();
}

// 🕒 Limpia mensaje a los 3 segundos
ocultarMensajeCargo(): void {
  setTimeout(() => (this.mensajeCargo = ''), 3000);
}


validarPassword(): void {
  const password = this.usuarioActual.contrasena || '';
  this.mensajePassword = '';

  // --- Verificar longitud mínima ---
  if (password.length < 8) {
    this.mensajePassword = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }

  // --- Debe tener al menos una mayúscula ---
  if (!/[A-Z]/.test(password)) {
    this.mensajePassword = 'Debe contener al menos una letra mayúscula.';
    return;
  }

  // --- Debe tener al menos un número o símbolo ---
  if (!/[0-9!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    this.mensajePassword = 'Debe contener al menos un número o un símbolo.';
    return;
  }

  // --- Solo letras, números y símbolos válidos ---
  if (!/^[A-Za-z0-9!@#$%^&*(),.?":{}|<>_\-]*$/.test(password)) {
    this.mensajePassword = 'Contiene caracteres no válidos.';
    return;
  }
}

}
