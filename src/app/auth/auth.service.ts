import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthStorageService } from './auth-storage.service';
import { AuthUser, LoginResponse, RegisterRequest, RegistrationDetail } from './auth.models';

interface LoginRequest {
  email: string;
  senha: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);
  private readonly session = signal<LoginResponse | null>(null);

  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/api/auth/login`, credentials)
      .pipe(tap((session) => this.setSession(session)));
  }

  register(request: RegisterRequest): Observable<RegistrationDetail> {
    return this.http.post<RegistrationDetail>(`${environment.apiUrl}/api/auth/register`, request);
  }

  restoreSession(): Observable<void> {
    const storedSession = this.storage.loadSession();

    if (!storedSession || this.isExpired(storedSession.expiresAt)) {
      this.clearSession();
      return of(undefined);
    }

    return this.http
      .get<AuthUser>(`${environment.apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedSession.token}` },
      })
      .pipe(
        tap((user) => this.setSession({ ...storedSession, user })),
        map(() => undefined),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        }),
      );
  }

  logout(): void {
    this.clearSession();
  }

  private setSession(session: LoginResponse): void {
    this.storage.saveSession(session);
    this.session.set(session);
  }

  private clearSession(): void {
    this.storage.clearSession();
    this.session.set(null);
  }

  private isExpired(expiresAt: string): boolean {
    const expirationTime = Date.parse(expiresAt);
    return Number.isNaN(expirationTime) || expirationTime <= Date.now();
  }
}
