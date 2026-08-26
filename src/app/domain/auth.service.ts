import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'ADMIN' | 'FARMACEUTICO' | 'ESTAGIARIO';
export interface AuthUser { id: string; email: string; role: UserRole; }
interface LoginResponse { token: string; expiresAt: string; user: AuthUser; }
const SESSION_KEY = 'fen-auth-session';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<LoginResponse | null>(this.restore());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  constructor(private readonly http: HttpClient) {}
  login(email: string, senha: string) { return this.http.post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, { email: email.trim(), senha }).pipe(tap((session) => this.persist(session))); }
  logout(): void { this.session.set(null); localStorage.removeItem(SESSION_KEY); }
  isAuthenticated(): boolean { return this.session() !== null; }
  isAdmin(): boolean { return this.currentUser()?.role === 'ADMIN'; }
  private persist(session: LoginResponse): void { this.session.set(session); localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
  private restore(): LoginResponse | null { try { const value = localStorage.getItem(SESSION_KEY); return value ? JSON.parse(value) as LoginResponse : null; } catch { return null; } }
}
