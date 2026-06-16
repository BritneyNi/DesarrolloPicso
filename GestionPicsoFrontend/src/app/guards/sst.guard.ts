import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const sstGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userData = authService.getUserData();
  const rol = userData?.rol?.toLowerCase();

  if (rol === 'sst' || rol === 'admin' ) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
