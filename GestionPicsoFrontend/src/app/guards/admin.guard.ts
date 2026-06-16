import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userData = authService.getUserData();
  const rol = userData?.rol?.toLowerCase();

  if (rol === 'admin' || rol === 'responsable') {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
