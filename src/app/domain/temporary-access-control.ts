import { Injectable, computed, signal } from '@angular/core';

export type TemporaryUserRole = 'ADMIN' | 'FARMACEUTICO' | 'ESTAGIARIO';

const ROLE_STORAGE_KEY = 'fen-temporary-role';
const DEFAULT_ROLE: TemporaryUserRole = 'FARMACEUTICO';
const ALLOWED_ROLES: TemporaryUserRole[] = ['ADMIN', 'FARMACEUTICO', 'ESTAGIARIO'];

@Injectable({ providedIn: 'root' })
export class TemporaryAccessControl {
  private readonly role = signal<TemporaryUserRole>(this.readInitialRole());

  readonly currentRole = computed(() => this.role());

  setRole(role: TemporaryUserRole): void {
    this.role.set(role);
    globalThis.localStorage?.setItem(ROLE_STORAGE_KEY, role);
  }

  canManagePasswordRecovery(): boolean {
    return this.role() === 'ADMIN';
  }

  canAccessAdminModules(): boolean {
    return this.role() === 'ADMIN';
  }

  private readInitialRole(): TemporaryUserRole {
    const persistedRole = globalThis.localStorage?.getItem(ROLE_STORAGE_KEY);

    if (ALLOWED_ROLES.includes(persistedRole as TemporaryUserRole)) {
      return persistedRole as TemporaryUserRole;
    }

    return DEFAULT_ROLE;
  }
}
