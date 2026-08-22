import { Injectable } from '@angular/core';
import { LoginResponse } from './auth.models';

const AUTH_SESSION_STORAGE_KEY = 'fen-auth-session';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  loadSession(): LoginResponse | null {
    const storage = this.browserStorage();

    if (!storage) {
      return null;
    }

    const serializedSession = storage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!serializedSession) {
      return null;
    }

    try {
      return JSON.parse(serializedSession) as LoginResponse;
    } catch {
      storage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }
  }

  saveSession(session: LoginResponse): void {
    this.browserStorage()?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  clearSession(): void {
    this.browserStorage()?.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  private browserStorage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
