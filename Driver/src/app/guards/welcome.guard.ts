import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const welcomeGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.getToken()) {
    return router.parseUrl('/tabs/beranda');
  }

  if (localStorage.getItem('welcome_seen') === 'true') {
    return router.parseUrl('/login');
  }

  return true;
};
