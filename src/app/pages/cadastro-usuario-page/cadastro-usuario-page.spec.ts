import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UsuarioService } from '../../domain/usuario.service';
import { CadastroUsuarioPage } from './cadastro-usuario-page';

describe('CadastroUsuarioPage', () => {
  let fixture: ComponentFixture<CadastroUsuarioPage>;
  const router = { navigate: vi.fn() };
  const register = vi.fn((_: Record<string, unknown>) => of({}));
  const service = {
    supervisores: vi.fn(() => of([{ id: 'supervisor-id', nome: 'Ana Supervisora' }])),
    register,
  };

  beforeEach(async () => {
    register.mockClear();
    router.navigate.mockClear();
    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioPage],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: router },
        { provide: UsuarioService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CadastroUsuarioPage);
    fixture.detectChanges();
  });

  it('masks CPF while keeping only eleven digits available for registration', () => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#cpf')!;

    input.value = '12345678900';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(input.value).toBe('123.456.789-00');
  });

  it('shows field errors and does not submit an invalid form', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[type="submit"]')?.click();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('#cpf + .field-error')?.textContent).toContain(
      'CPF é obrigatório',
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('sends only pharmacist fields and redirects to login after registration', () => {
    fillPharmacistForm();
    const page = fixture.componentInstance as never as { submit(): void; error(): string };
    page.submit();

    expect(page.error()).toBe('');

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        cpf: '12345678901',
        role: 'FARMACEUTICO',
        crf: 'PR-1',
      }),
    );
    expect(register.mock.calls[0][0]).not.toHaveProperty('responsavelTecnico');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      state: { registrationMessage: 'Cadastro realizado com sucesso e enviado para aprovação.' },
    });
  });

  it('sends only intern fields after changing the selected profile', () => {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-profile="estagiario"]')
      ?.click();
    fixture.detectChanges();
    const page = fixture.componentInstance as never as {
      form: Record<string, string>;
      submit(): void;
      error(): string;
    };
    page.form = {
      nome: 'Ana', cpf: '123.456.789-01', dataNascimento: '', email: 'ana@fen.br',
      senha: 'segredo123', confirmarSenha: 'segredo123', crf: 'não deve ser enviado',
      tipoEstagio: 'obrigatorio', supervisor: 'supervisor-id',
      inicioVigencia: '2026-01-01', fimVigencia: '2026-12-01',
    };
    page.submit();

    expect(page.error()).toBe('');

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'ESTAGIARIO',
        tipoEstagio: 'OBRIGATORIO',
        supervisorId: 'supervisor-id',
      }),
    );
    expect(register.mock.calls[0][0]).not.toHaveProperty('crf');
  });

  function fillPharmacistForm(): void {
    fillInput('#nome', 'Ana');
    fillCpf('123.456.789-01');
    fillInput('#dataNascimento', '1990-01-01');
    fillInput('#email', 'ana@fen.br');
    fillInput('#senha', 'segredo123');
    fillInput('#confirmarSenha', 'segredo123');
    fillInput('#crf', 'PR-1');
  }

  function fillCpf(value: string): void {
    fillInput('#cpf', value);
  }

  function fillInput(selector: string, value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    fixture.detectChanges();
  }
});
