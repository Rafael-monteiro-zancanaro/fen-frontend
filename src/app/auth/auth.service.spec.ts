import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { environment } from '../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import { AuthUser, LoginResponse, RegisterRequest, RegistrationDetail } from './auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: HttpTestingController;
  let service: AuthService;
  let storage: AuthStorageService;

  const admin: AuthUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@fen.br',
    role: 'ADMIN',
  };

  const loginResponse: LoginResponse = {
    token: 'jwt-token',
    expiresAt: '2026-08-22T01:00:00Z',
    user: admin,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T20:00:00Z'));
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, AuthStorageService],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
    storage = TestBed.inject(AuthStorageService);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.useRealTimers();
  });

  it('logs in with the exact credentials and persists only the returned session', () => {
    const credentials = { email: 'admin@fen.br', senha: 'admin123' };
    let result: LoginResponse | undefined;

    expect(service.isAuthenticated()).toBe(false);

    service.login(credentials).subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/api/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(credentials);
    request.flush(loginResponse);

    expect(result).toEqual(loginResponse);
    expect(service.currentUser()).toEqual(admin);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('jwt-token');
    expect(storage.loadSession()).toEqual(loginResponse);
    expect(localStorage.getItem(localStorage.key(0) ?? '')).not.toContain('admin123');
  });

  it('registers with the exact public registration payload without creating a session', () => {
    const payload: RegisterRequest = {
      nome: 'Ana Silva',
      cpf: '12345678901',
      dataNascimento: '1990-05-10',
      email: 'ana@fen.br',
      senha: 'senha123',
      role: 'FARMACEUTICO',
      crf: 'CRF-123',
      responsavelTecnico: true,
    };
    const detail: RegistrationDetail = {
      usuarioId: '10000000-0000-0000-0000-000000000001',
      funcionarioId: '20000000-0000-0000-0000-000000000001',
      email: 'ana@fen.br',
      role: 'FARMACEUTICO',
      situacao: 'PENDENTE',
    };
    let result: RegistrationDetail | undefined;

    service.register(payload).subscribe((response) => (result = response));

    const request = http.expectOne(`${environment.apiUrl}/api/auth/register`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(detail);

    expect(result).toEqual(detail);
    expect(service.isAuthenticated()).toBe(false);
    expect(storage.loadSession()).toBeNull();
  });

  it('restores a non-expired session only after confirming the user through /me', () => {
    const confirmedUser: AuthUser = { ...admin, email: 'admin.confirmado@fen.br' };
    storage.saveSession(loginResponse);

    service.restoreSession().subscribe();

    expect(service.isAuthenticated()).toBe(false);
    const request = http.expectOne(`${environment.apiUrl}/api/auth/me`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush(confirmedUser);

    expect(service.currentUser()).toEqual(confirmedUser);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.token()).toBe('jwt-token');
    expect(storage.loadSession()).toEqual({ ...loginResponse, user: confirmedUser });
  });

  it('discards an expired session locally without making an HTTP request', () => {
    storage.saveSession({ ...loginResponse, expiresAt: '2026-08-21T19:59:59Z' });

    service.restoreSession().subscribe();

    http.expectNone(`${environment.apiUrl}/api/auth/me`);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(storage.loadSession()).toBeNull();
  });

  it('clears the session when /me rejects restoration and completes startup', () => {
    storage.saveSession(loginResponse);
    let completed = false;

    service.restoreSession().subscribe({ complete: () => (completed = true) });

    http
      .expectOne(`${environment.apiUrl}/api/auth/me`)
      .flush({ message: 'Não autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(completed).toBe(true);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(storage.loadSession()).toBeNull();
  });

  it('logs out by clearing both reactive and persisted session state', () => {
    service.login({ email: 'admin@fen.br', senha: 'admin123' }).subscribe();
    http.expectOne(`${environment.apiUrl}/api/auth/login`).flush(loginResponse);

    service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token()).toBeNull();
    expect(storage.loadSession()).toBeNull();
  });
});
