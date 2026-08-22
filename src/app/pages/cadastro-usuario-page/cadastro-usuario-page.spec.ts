import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
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

  it('requires CRF again after changing from intern back to pharmacist', () => {
    selectInternProfile();
    fillCommonFields();
    selectPharmacistProfile(false);

    submit();

    expect(register).not.toHaveBeenCalled();
    expect(fieldError('registration-crf')).toContain('CRF é obrigatório');
    expect(input('#crf').getAttribute('aria-invalid')).toBe('true');
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

  it('shows nearby feedback and aria-invalid for values beyond backend limits', () => {
    const longPassword = 's'.repeat(73);
    setInputValue('#nome', 'N'.repeat(151));
    setInputValue('#cpf', '12345678901');
    setInputValue('#email', `ana@${'e'.repeat(248)}.br`);
    setInputValue('#senha', longPassword);
    setInputValue('#confirmarSenha', longPassword);
    setInputValue('#crf', 'C'.repeat(21));

    submit();

    expect(register).not.toHaveBeenCalled();
    expect(fieldError('registration-name')).toContain('no máximo 150 caracteres');
    expect(fieldError('registration-email')).toContain('no máximo 254 caracteres');
    expect(fieldError('registration-password')).toContain('no máximo 72 caracteres');
    expect(fieldError('registration-crf')).toContain('no máximo 20 caracteres');
    expect(input('#nome').getAttribute('aria-invalid')).toBe('true');
    expect(input('#email').getAttribute('aria-invalid')).toBe('true');
    expect(input('#senha').getAttribute('aria-invalid')).toBe('true');
    expect(input('#crf').getAttribute('aria-invalid')).toBe('true');
  });

  it.each([
    {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      fieldErrors: { email: 'Informe um e-mail válido', cpf: 'Informe um CPF válido' },
    },
    {
      status: 409,
      code: 'CONFLICT',
      message: 'E-mail já cadastrado',
      fieldErrors: {},
    },
  ])('shows safe ApiError feedback returned with status $status', (apiError) => {
    registerResult = throwError(
      () =>
        new HttpErrorResponse({
          status: apiError.status,
          error: { timestamp: '2026-08-21T23:00:00Z', ...apiError },
        }),
    );
    fillCommonFields();
    setInputValue('#crf', 'PR-12345');

    submit();
    fixture.detectChanges();

    const feedback = nativeElement().querySelector('[data-registration-error]')?.textContent ?? '';
    expect(feedback).toContain(apiError.message);
    for (const fieldError of Object.values(apiError.fieldErrors)) {
      expect(feedback).toContain(fieldError);
    }
  });

  it('uses generic feedback for unexpected errors without exposing internal details', () => {
    registerResult = throwError(
      () =>
        new HttpErrorResponse({
          status: 500,
          error: { message: 'org.hibernate.ConstraintViolationException: internal detail' },
        }),
    );
    fillCommonFields();
    setInputValue('#crf', 'PR-12345');

    submit();
    fixture.detectChanges();

    const feedback = nativeElement().querySelector('[data-registration-error]')?.textContent ?? '';
    expect(feedback).toContain('Revise os dados informados e tente novamente');
    expect(feedback).not.toContain('hibernate');
    expect(feedback).not.toContain('internal detail');
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

  function selectPharmacistProfile(detectChanges = true): void {
    const button = nativeElement().querySelector<HTMLButtonElement>(
      '[data-profile="farmaceutico"]',
    );
    if (!button) {
      throw new Error('Expected pharmacist profile button.');
    }
    button.click();
    if (detectChanges) {
      fixture.detectChanges();
    }
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
