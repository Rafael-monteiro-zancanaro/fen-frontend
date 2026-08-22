import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const PUBLIC_AUTH_PATHS = ['/api/auth/login', '/api/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiRequest = isApiRequest(request.url);
  const publicAuthRequest = isPublicAuthRequest(request.url);
  const requiresAuthentication = apiRequest && !publicAuthRequest;
  const token = auth.token();
  const authenticatedRequest =
    token && requiresAuthentication
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && requiresAuthentication) {
          auth.logout();
          void router.navigate(['/login']);
        } else if (error.status === 403 && apiRequest) {
          void router.navigate(['/inicio']);
        }
      }

      return throwError(() => error);
    }),
  );
};

function isApiRequest(url: string): boolean {
  const apiUrl = environment.apiUrl.replace(/\/$/, '');
  return url.startsWith(`${apiUrl}/api/`);
}

function isPublicAuthRequest(url: string): boolean {
  const path = url.split(/[?#]/, 1)[0];
  return PUBLIC_AUTH_PATHS.some((publicPath) => path.endsWith(publicPath));
}
