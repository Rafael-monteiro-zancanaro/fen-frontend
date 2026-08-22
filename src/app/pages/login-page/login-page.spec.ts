import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../auth/auth.service';
import { LoginResponse } from '../../auth/auth.models';
import { LoginPage } from './login-page';

@Component({ template: '' })
class InicioStubPage {}

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let loginResult: Observable<LoginResponse>;
  let login: ReturnType<typeof vi.fn>;

  const successfulLogin: LoginResponse = {
    token: 'jwt-token',
    expiresAt: '2026-08-22T01:00:00Z',
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@fen.br',
      role: 'ADMIN',
    },
  };

  beforeEach(async () => {
    loginResult = new Subject<LoginResponse>();
    login = vi.fn(() => loginResult);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([{ path: 'inicio', component: InicioStubPage }]),
        {
          provide: AuthService,
          useValue: { login },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('submits only the entered credentials, disables while pending and navigates on success', async () => {
    const pendingLogin = new Subject<LoginResponse>();
    loginResult = pendingLogin;
    fillCredentials('admin@fen.br', 'senha-segura');

    submit();

    expect(login).toHaveBeenCalledWith({ email: 'admin@fen.br', senha: 'senha-segura' });
    expect(submitButton().disabled).toBe(true);
    expect(submitButton().textContent).toContain('Entrando');

    pendingLogin.next(successfulLogin);
    pendingLogin.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  it.each([401, 500])('shows the same safe feedback when login fails with status %s', (status) => {
    loginResult = throwError(() => ({ status }));
    fillCredentials('usuario@fen.br', 'senha-incorreta');

    submit();
    fixture.detectChanges();

    expect(nativeElement().querySelector('[data-login-error]')?.textContent).toContain(
      'E-mail ou senha inválidos.',
    );
    expect(submitButton().disabled).toBe(false);
  });

  it('shows field validation and does not submit empty credentials', () => {
    submit();
    fixture.detectChanges();

    expect(login).not.toHaveBeenCalled();
    expect(
      nativeElement().querySelector('[data-field-error="login-email"]')?.textContent,
    ).toContain('E-mail é obrigatório');
    expect(
      nativeElement().querySelector('[data-field-error="login-password"]')?.textContent,
    ).toContain('Senha é obrigatória');
  });

  it('blocks a password above the BCrypt 72-byte UTF-8 limit', () => {
    fillCredentials('usuario@fen.br', 'é'.repeat(37));

    submit();

    expect(login).not.toHaveBeenCalled();
    expect(
      nativeElement().querySelector('[data-field-error="login-password"]')?.textContent,
    ).toContain('72 bytes');
    expect(input('#senha').getAttribute('aria-invalid')).toBe('true');
  });

  it('does not render a nonfunctional access-persistence checkbox', () => {
    expect(nativeElement().querySelector('input[type="checkbox"]')).toBeNull();
    expect(nativeElement().textContent).not.toContain('Manter meu acesso');
  });

  it('does not expose the temporary role selector', () => {
    expect(nativeElement().querySelector('#perfilTemporario')).toBeNull();
    expect(nativeElement().textContent).not.toContain('Perfil de acesso');
  });

  function fillCredentials(email: string, senha: string): void {
    setInputValue('#email', email);
    setInputValue('#senha', senha);
  }

  function setInputValue(selector: string, value: string): void {
    const element = input(selector);

    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function input(selector: string): HTMLInputElement {
    const element = nativeElement().querySelector<HTMLInputElement>(selector);
    if (!element) {
      throw new Error(`Expected input ${selector}.`);
    }
    return element;
  }

  function submit(): void {
    submitButton().click();
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    const button = nativeElement().querySelector<HTMLButtonElement>('button[type="submit"]');

    if (!button) {
      throw new Error('Expected login submit button.');
    }

    return button;
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
