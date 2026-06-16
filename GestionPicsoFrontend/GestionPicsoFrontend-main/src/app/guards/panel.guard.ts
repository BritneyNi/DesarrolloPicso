import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const panelGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const rol = auth.getUserData()?.rol?.toLowerCase()?.trim();

  if (
    rol === 'admin' ||
    rol === 'sst' ||
    rol === 'almacenista' ||
    rol === 'contabilidad'
  ) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
