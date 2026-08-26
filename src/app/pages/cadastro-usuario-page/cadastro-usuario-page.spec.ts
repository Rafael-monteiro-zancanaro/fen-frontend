import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { UsuarioService } from '../../domain/usuario.service';
import { CadastroUsuarioPage } from './cadastro-usuario-page';

describe('CadastroUsuarioPage', () => {
  let fixture: ComponentFixture<CadastroUsuarioPage>;
  const service = {
    supervisores: vi.fn(() => of([{ id: 'supervisor-id', nome: 'Ana Supervisora' }])),
    register: vi.fn(() => of({})),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioPage],
      providers: [{ provide: UsuarioService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(CadastroUsuarioPage);
    fixture.detectChanges();
  });

  it('loads supervisors and sends pharmacist registration data', () => {
    const page = fixture.componentInstance as never as {
      form: Record<string, string | boolean>;
      submit(): void;
    };
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-profile="estagiario"]')
      ?.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ana Supervisora');
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-profile="farmaceutico"]')
      ?.click();
    page.form = {
      nome: 'Ana',
      cpf: '12345678901',
      email: 'ana@fen.br',
      senha: 'segredo123',
      confirmarSenha: 'segredo123',
      crf: 'PR-1',
      responsavelTecnico: true,
      tipoEstagio: '',
    };
    page.submit();
    expect(service.register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'FARMACEUTICO', crf: 'PR-1', responsavelTecnico: true }),
    );
  });

  it('does not submit when password confirmation differs', () => {
    const page = fixture.componentInstance as never as {
      form: Record<string, string | boolean>;
      submit(): void;
    };
    service.register.mockClear();
    page.form = { senha: 'a', confirmarSenha: 'b', tipoEstagio: '' };
    page.submit();
    expect(service.register).not.toHaveBeenCalled();
  });
});
