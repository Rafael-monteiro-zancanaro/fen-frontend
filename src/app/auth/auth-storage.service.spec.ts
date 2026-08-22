import { TestBed } from '@angular/core/testing';
import { LoginResponse } from './auth.models';
import { AuthStorageService } from './auth-storage.service';

describe('AuthStorageService', () => {
  let storage: AuthStorageService;

  const session: LoginResponse = {
    token: 'jwt-token',
    expiresAt: '2026-08-22T01:00:00Z',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@fen.br',
      role: 'ADMIN',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [AuthStorageService] });
    storage = TestBed.inject(AuthStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists and reads the complete session under one storage key', () => {
    storage.saveSession(session);

    expect(localStorage.length).toBe(1);
    expect(storage.loadSession()).toEqual(session);
    expect(JSON.parse(localStorage.getItem(localStorage.key(0) ?? '') ?? 'null')).toEqual(session);
  });

  it('clears the persisted session', () => {
    storage.saveSession(session);

    storage.clearSession();

    expect(storage.loadSession()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('discards a malformed persisted session', () => {
    localStorage.setItem('fen-auth-session', '{invalid');

    expect(storage.loadSession()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
