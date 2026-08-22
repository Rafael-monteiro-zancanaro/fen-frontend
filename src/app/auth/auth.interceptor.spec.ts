import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { environment } from '../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import { LoginResponse } from './auth.models';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

@Component({ template: '' })
class TestPage {}

describe('authInterceptor', () => {
  let auth: AuthService;
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;
  let storage: AuthStorageService;

  const session: LoginResponse = {
    token: 'jwt-token',
    expiresAt: '2099-08-22T01:00:00Z',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@fen.br',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'login', component: TestPage },
          { path: 'inicio', component: TestPage },
        ]),
        AuthService,
        AuthStorageService,
      ],
    });

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    storage = TestBed.inject(AuthStorageService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('adds the current bearer token to an authenticated API request', () => {
    establishSession();

    http.get(`${environment.apiUrl}/api/pacientes`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/api/pacientes`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('does not expose or clear the session for a non-API request returning 401', async () => {
    establishSession();
    await router.navigateByUrl('/inicio');

    http.get('https://example.test/resource').subscribe({ error: () => undefined });

    const request = httpTesting.expectOne('https://example.test/resource');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    await new Promise((resolve) => setTimeout(resolve));
    expect(router.url).toBe('/inicio');
    expect(auth.isAuthenticated()).toBe(true);
    expect(storage.loadSession()).toEqual(session);
  });

  it.each([
    ['login', `${environment.apiUrl}/api/auth/login`],
    ['registration', `${environment.apiUrl}/api/auth/register`],
  ])('does not add a bearer token to the public %s request', (_, url) => {
    establishSession();

    http.post(url, {}).subscribe();

    const request = httpTesting.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('clears the session and navigates to login after a protected request returns 401', async () => {
    establishSession();
    await router.navigateByUrl('/inicio');

    http.get(`${environment.apiUrl}/api/pacientes`).subscribe({ error: () => undefined });
    httpTesting
      .expectOne(`${environment.apiUrl}/api/pacientes`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    await vi.waitFor(() => expect(router.url).toBe('/login'));
    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.loadSession()).toBeNull();
  });

  it.each([
    ['login', `${environment.apiUrl}/api/auth/login`],
    ['registration', `${environment.apiUrl}/api/auth/register`],
  ])('preserves the session and current route when public %s returns 401', async (_, url) => {
    establishSession();
    await router.navigateByUrl('/inicio');

    http.post(url, {}).subscribe({ error: () => undefined });
    httpTesting.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });

    await new Promise((resolve) => setTimeout(resolve));
    expect(router.url).toBe('/inicio');
    expect(auth.isAuthenticated()).toBe(true);
    expect(storage.loadSession()).toEqual(session);
  });

  it('preserves the session and navigates to inicio after a request returns 403', async () => {
    establishSession();
    await router.navigateByUrl('/login');

    http.get(`${environment.apiUrl}/api/admin/usuarios/pendentes`).subscribe({
      error: () => undefined,
    });
    httpTesting
      .expectOne(`${environment.apiUrl}/api/admin/usuarios/pendentes`)
      .flush({}, { status: 403, statusText: 'Forbidden' });

    await vi.waitFor(() => expect(router.url).toBe('/inicio'));
    expect(auth.isAuthenticated()).toBe(true);
    expect(storage.loadSession()).toEqual(session);
  });

  it('allows AuthService to consume a restoration 401 and complete application startup', async () => {
    storage.saveSession(session);
    let completed = false;

    auth.restoreSession().subscribe({ complete: () => (completed = true) });
    httpTesting
      .expectOne(`${environment.apiUrl}/api/auth/me`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    await vi.waitFor(() => expect(router.url).toBe('/login'));
    expect(completed).toBe(true);
    expect(auth.isAuthenticated()).toBe(false);
    expect(storage.loadSession()).toBeNull();
  });

  function establishSession(): void {
    auth.login({ email: 'admin@fen.br', senha: 'admin123' }).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(session);
  }
});
