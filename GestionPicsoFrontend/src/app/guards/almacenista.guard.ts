import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const almacenistaGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = auth.getUserData()?.rol?.toLowerCase();
  if (rol === 'admin' || rol === 'almacenista' || rol === 'responsable' || rol === 'sst') {
    return true;
  }
  router.navigate(['/home']);
  return false;
};