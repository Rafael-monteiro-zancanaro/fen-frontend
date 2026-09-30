import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthService).token();
  const apiPrefix = `${environment.apiUrl.replace(/\/$/, '')}/`;
  const isFenApiRequest = request.url.startsWith(apiPrefix);

  return next(
    token && isFenApiRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request,
  );
};
