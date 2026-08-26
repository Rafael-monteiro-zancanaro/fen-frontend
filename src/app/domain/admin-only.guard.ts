import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TemporaryAccessControl } from './temporary-access-control';

export const adminOnlyGuard: CanActivateFn = () => {
  const accessControl = inject(TemporaryAccessControl);
  const router = inject(Router);

  return accessControl.canManagePasswordRecovery() || router.createUrlTree(['/inicio']);
};
