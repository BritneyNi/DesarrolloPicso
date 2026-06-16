import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { APP_VERSION } from '../../../environments/version';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent {
  version = APP_VERSION;
  loginForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      cedula: ['', [Validators.required]],
      contrasena: ['', [Validators.required]],
    });
  }

onSubmit() {
  if (this.loginForm.invalid) return;

  this.authService.login(this.loginForm.value).subscribe({
    next: () => {
      const userData = this.authService.getUserData();
      const role = userData?.rol?.toLowerCase();

      if (!role) {
        console.error("No se pudo obtener el rol del token.");
        alert('Error al obtener los datos del usuario.');
        return;
      }
      if (role === 'admin' || role=== 'sst' || role ==='almacenista') {
        this.router.navigate(['/panel-control']);
      } 
      else if (role === 'contabilidad') {
        this.router.navigate(['/contabilidad']);
      }
      else {
        this.router.navigate(['/home']);
      }
    },
    error: (err) => {
      console.error('Error en login:', err);
      alert('Credenciales incorrectas');
    },
  });
}

}
