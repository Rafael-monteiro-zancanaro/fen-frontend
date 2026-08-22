import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { adminOnlyGuard } from '../domain/admin-only.guard';
import { routes } from '../app.routes';
import { AuthUser } from './auth.models';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authentication guards', () => {
  let currentUser: WritableSignal<AuthUser | null>;
  let isAuthenticated: WritableSignal<boolean>;
  let router: Router;

  beforeEach(() => {
    currentUser = signal<AuthUser | null>(null);
    isAuthenticated = signal(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser, isAuthenticated },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('returns a login UrlTree when an unauthenticated user opens an internal route', () => {
    const result = runGuard(authGuard);

    expect(result).toBeInstanceOf(router.createUrlTree(['/login']).constructor);
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/login');
  });

  it('allows an authenticated FARMACEUTICO to open a normal internal route', () => {
    authenticateAs('FARMACEUTICO');

    expect(runGuard(authGuard)).toBe(true);
  });

  it('allows an ADMIN to open an administrative route', () => {
    authenticateAs('ADMIN');

    expect(runGuard(adminOnlyGuard)).toBe(true);
  });

  it('returns an inicio UrlTree when a FARMACEUTICO opens an administrative route', () => {
    authenticateAs('FARMACEUTICO');

    const result = runGuard(adminOnlyGuard);

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe('/inicio');
  });

  it('protects every internal route while leaving only login, cadastro and recovery public', () => {
    const componentRoutes = routes.filter((route) => route.component);
    const publicPaths = componentRoutes
      .filter((route) => !route.canActivate?.includes(authGuard))
      .map((route) => route.path);

    expect(publicPaths).toEqual(['login', 'cadastro', 'recuperar-senha']);
  });

  it('requires both authentication and ADMIN role on every existing administrative route', () => {
    const adminRoutes = routes.filter((route) => route.path?.startsWith('admin/'));

    expect(adminRoutes.length).toBeGreaterThan(0);
    for (const route of adminRoutes) {
      expect(route.canActivate).toEqual([authGuard, adminOnlyGuard]);
    }
  });

  function authenticateAs(role: AuthUser['role']): void {
    currentUser.set({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'usuario@fen.br',
      role,
    });
    isAuthenticated.set(true);
  }

  function runGuard(guard: typeof authGuard | typeof adminOnlyGuard): unknown {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }
});
