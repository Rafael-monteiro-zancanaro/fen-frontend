import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../domain/auth.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  const loginResult = new Subject<unknown>();
  const login = vi.fn(() => loginResult);

  beforeEach(async () => {
    login.mockClear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
  });

  it('shows field errors and skips authentication when required credentials are empty', () => {
    page().querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();

    expect(page().querySelector('#emailError')?.textContent).toContain('E-mail é obrigatório');
    expect(page().querySelector('#senhaError')?.textContent).toContain('Senha é obrigatória');
    expect(login).not.toHaveBeenCalled();
  });

  it('shows a disabled loading button while authentication is pending', () => {
    fill('#email', 'usuario@uem.br');
    fill('#senha', 'segredo');
    page().querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();

    const button = page().querySelector<HTMLButtonElement>('[type="submit"]')!;
    expect(login).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Entrando');
    expect(button.querySelector('.spinner')).not.toBeNull();
  });

  function fill(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
