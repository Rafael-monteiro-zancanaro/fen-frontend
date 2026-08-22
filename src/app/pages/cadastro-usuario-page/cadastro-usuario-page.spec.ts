import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of } from 'rxjs';
import { vi } from 'vitest';
import { RegistrationDetail, RegisterRequest } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';
import { RegistrationService, SupervisorOption } from '../../auth/registration.service';
import { CadastroUsuarioPage } from './cadastro-usuario-page';

describe('CadastroUsuarioPage', () => {
  let fixture: ComponentFixture<CadastroUsuarioPage>;
  let registerResult: Observable<RegistrationDetail>;
  let register: ReturnType<typeof vi.fn>;
  let login: ReturnType<typeof vi.fn>;

  const supervisors: SupervisorOption[] = [
    { id: '00000000-0000-0000-0000-000000000101', nome: 'Ana Supervisora' },
    { id: '00000000-0000-0000-0000-000000000102', nome: 'Bruno Supervisor' },
  ];

  const pendingRegistration: RegistrationDetail = {
    usuarioId: '00000000-0000-0000-0000-000000000201',
    funcionarioId: '00000000-0000-0000-0000-000000000301',
    email: 'ana@uem.br',
    role: 'FARMACEUTICO',
    situacao: 'PENDENTE',
  };

  beforeEach(async () => {
    registerResult = new Subject<RegistrationDetail>();
    register = vi.fn(() => registerResult);
    login = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CadastroUsuarioPage],
      providers: [
        {
          provide: AuthService,
          useValue: { register, login },
        },
        {
          provide: RegistrationService,
          useValue: { findSupervisores: () => of(supervisors) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroUsuarioPage);
    fixture.detectChanges();
  });

  it('renders supervisors returned by the public endpoint in the intern select', () => {
    selectInternProfile();

    const options = Array.from(
      nativeElement().querySelectorAll<HTMLOptionElement>('#supervisor option'),
    );
    expect(options.map(({ value, textContent }) => [value, textContent?.trim()])).toEqual([
      ['', 'Selecione um farmacêutico'],
      ['00000000-0000-0000-0000-000000000101', 'Ana Supervisora'],
      ['00000000-0000-0000-0000-000000000102', 'Bruno Supervisor'],
    ]);
  });

  it('submits the exact pharmacist DTO without intern-only or confirmation values', () => {
    fillCommonFields();
    setInputValue('#dataNascimento', '1990-05-10');
    setInputValue('#crf', 'PR-12345');
    clickCheckbox('#responsavelTecnico');

    submit();

    const expected: RegisterRequest = {
      nome: 'Ana Silva',
      cpf: '12345678901',
      dataNascimento: '1990-05-10',
      email: 'ana@uem.br',
      senha: 'senha123',
      role: 'FARMACEUTICO',
      crf: 'PR-12345',
      responsavelTecnico: true,
    };
    expect(register).toHaveBeenCalledWith(expected);
  });

  it('submits the exact intern DTO with the selected supervisor UUID', () => {
    selectInternProfile();
    fillCommonFields();
    setSelectValue('#tipoEstagio', 'NAO_OBRIGATORIO');
    setSelectValue('#supervisor', '00000000-0000-0000-0000-000000000102');
    setInputValue('#inicioVigencia', '2026-08-24');
    setInputValue('#fimVigencia', '2026-12-18');

    submit();

    const expected: RegisterRequest = {
      nome: 'Ana Silva',
      cpf: '12345678901',
      email: 'ana@uem.br',
      senha: 'senha123',
      role: 'ESTAGIARIO',
      tipoEstagio: 'NAO_OBRIGATORIO',
      supervisorId: '00000000-0000-0000-0000-000000000102',
      inicioVigencia: '2026-08-24',
      fimVigencia: '2026-12-18',
    };
    expect(register).toHaveBeenCalledWith(expected);
  });

  it('keeps mismatched password confirmation on the client and does not register', () => {
    fillCommonFields();
    setInputValue('#crf', 'PR-12345');
    setInputValue('#confirmarSenha', 'outra-senha');

    submit();

    expect(register).not.toHaveBeenCalled();
    expect(
      nativeElement().querySelector('[data-field-error="registration-password-confirmation"]')
        ?.textContent,
    ).toContain('As senhas devem ser iguais');
  });

  it('shows nearby field feedback and does not submit invalid required values', () => {
    submit();

    expect(register).not.toHaveBeenCalled();
    expect(fieldError('registration-name')).toContain('Nome completo é obrigatório');
    expect(fieldError('registration-cpf')).toContain('CPF é obrigatório');
    expect(fieldError('registration-email')).toContain('E-mail é obrigatório');
    expect(fieldError('registration-password')).toContain('Senha é obrigatória');
    expect(fieldError('registration-crf')).toContain('CRF é obrigatório');
  });

  it('shows pending-approval confirmation after success without logging in', () => {
    const response = new Subject<RegistrationDetail>();
    registerResult = response;
    fillCommonFields();
    setInputValue('#crf', 'PR-12345');

    submit();
    response.next(pendingRegistration);
    response.complete();
    fixture.detectChanges();

    expect(nativeElement().querySelector('[data-registration-success]')?.textContent).toContain(
      'aguarda aprovação',
    );
    expect(login).not.toHaveBeenCalled();
  });

  function fillCommonFields(): void {
    setInputValue('#nome', 'Ana Silva');
    setInputValue('#cpf', '12345678901');
    setInputValue('#email', 'ana@uem.br');
    setInputValue('#senha', 'senha123');
    setInputValue('#confirmarSenha', 'senha123');
  }

  function selectInternProfile(): void {
    const button = nativeElement().querySelector<HTMLButtonElement>('[data-profile="estagiario"]');
    if (!button) {
      throw new Error('Expected intern profile button.');
    }
    button.click();
    fixture.detectChanges();
  }

  function setInputValue(selector: string, value: string): void {
    const input = nativeElement().querySelector<HTMLInputElement>(selector);
    if (!input) {
      throw new Error(`Expected input ${selector}.`);
    }
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setSelectValue(selector: string, value: string): void {
    const select = nativeElement().querySelector<HTMLSelectElement>(selector);
    if (!select) {
      throw new Error(`Expected select ${selector}.`);
    }
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function clickCheckbox(selector: string): void {
    const checkbox = nativeElement().querySelector<HTMLInputElement>(selector);
    if (!checkbox) {
      throw new Error(`Expected checkbox ${selector}.`);
    }
    checkbox.click();
    fixture.detectChanges();
  }

  function submit(): void {
    const button = nativeElement().querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button) {
      throw new Error('Expected registration submit button.');
    }
    button.click();
    fixture.detectChanges();
  }

  function fieldError(name: string): string {
    return nativeElement().querySelector(`[data-field-error="${name}"]`)?.textContent?.trim() ?? '';
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
