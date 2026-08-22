import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';
import { AuthUser } from './auth/auth.models';
import { AuthService } from './auth/auth.service';
import { TemporaryPasswordRecoveryStore } from './domain/temporary-password-recovery-store';
import { TemporaryClinicalRecordsStore } from './domain/temporary-clinical-records-store';
import { TemporaryPharmacyEmployeeStore } from './domain/temporary-pharmacy-employee-store';
import { TemporaryPharmaceuticalServiceStore } from './domain/temporary-pharmaceutical-service-store';

describe('App', () => {
  let currentUser: WritableSignal<AuthUser | null>;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    currentUser = signal<AuthUser | null>({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'usuario@fen.br',
      role: 'FARMACEUTICO',
    });
    logout = vi.fn(() => currentUser.set(null));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => currentUser() !== null,
            currentUser,
            logout,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app shell with navigation', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const app = fixture.componentInstance;
    const compiled = fixture.nativeElement as HTMLElement;

    expect(app).toBeTruthy();
    expect(compiled.querySelector('header img')?.getAttribute('src')).toBe('/uem-logo.png');
    expect(compiled.querySelector('header img')?.getAttribute('alt')).toBe('Logo da UEM');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Login');
    expect(compiled.querySelector('a[routerLink="/cadastro"]')?.textContent).toContain('Cadastro');
  });

  it('should render the login page on the default route', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Seja bem-vindo');
    expect(compiled.querySelector('main[data-page="login"] p.leading-7')?.textContent).toContain(
      'Digite as credenciais para acesso ao sistema',
    );
    expect(compiled.querySelector('label[for="email"]')?.textContent).toContain('E-mail');
    expect(compiled.querySelector('input#senha')?.getAttribute('autocomplete')).toBe(
      'current-password',
    );
    expect(compiled.querySelector('a[routerLink="/recuperar-senha"]')?.textContent).toContain(
      'Esqueci minha senha',
    );
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Entrar');
    expect(compiled.querySelector('label[for="nome"]')).toBeNull();
  });

  it('should request password recovery without showing the password after submit', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/recuperar-senha');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[data-field-error="recovery-email"]')?.textContent).toContain(
      'E-mail é obrigatório',
    );

    const email = compiled.querySelector<HTMLInputElement>('#recoveryEmail');
    const password = compiled.querySelector<HTMLInputElement>('#newPassword');
    const confirmation = compiled.querySelector<HTMLInputElement>('#confirmNewPassword');

    if (!email || !password || !confirmation) {
      throw new Error('Recovery form inputs were not rendered.');
    }

    email.value = 'usuario@uem.br';
    email.dispatchEvent(new Event('input'));
    password.value = '__FORM_PASSWORD_VALUE__';
    password.dispatchEvent(new Event('input'));
    confirmation.value = 'diferente';
    confirmation.dispatchEvent(new Event('input'));

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-field-error="password-confirmation"]')?.textContent,
    ).toContain('As senhas devem ser iguais');

    confirmation.value = '__FORM_PASSWORD_VALUE__';
    confirmation.dispatchEvent(new Event('input'));
    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('.alert-success')?.textContent).toContain(
      'Solicitação enviada com sucesso',
    );
    expect(compiled.textContent).not.toContain('__FORM_PASSWORD_VALUE__');
    expect(JSON.stringify(localStorage)).not.toContain('__FORM_PASSWORD_VALUE__');
  });

  it('should render the registration page on /cadastro', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/cadastro');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Novo por aqui?');
    expect(compiled.querySelector('label[for="nome"]')?.textContent).toContain('Nome completo');
    expect(compiled.querySelector('input#cpf')?.getAttribute('maxlength')).toBe('11');
    expect(
      compiled.querySelector('main[data-page="cadastro"]')?.classList.contains('items-start'),
    ).toBe(true);
    expect(
      compiled.querySelector('main[data-page="cadastro"]')?.classList.contains('items-center'),
    ).toBe(false);
    expect(compiled.querySelector('button[data-profile="farmaceutico"]')).toBeTruthy();
    expect(compiled.querySelector('label[for="crf"]')?.textContent).toContain('CRF');
  });

  it('should switch registration profile fields on /cadastro', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/cadastro');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const internButton = compiled.querySelector<HTMLButtonElement>(
      'button[data-profile="estagiario"]',
    );

    internButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('label[for="tipoEstagio"]')?.textContent).toContain('Tipo de');
    expect(compiled.querySelector('label[for="inicioVigencia"]')?.textContent).toContain(
      'Inicio da vig',
    );
    expect(compiled.querySelector('label[for="fimVigencia"]')?.textContent).toContain('Fim da vig');
    expect(compiled.querySelector('label[for="supervisor"]')?.textContent).toContain('Supervisor');
    expect(compiled.querySelector('label[for="crf"]')).toBeNull();
  });

  it('should render internal navigation and attendance dashboard on /inicio', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/inicio');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Inicio');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Atendimentos');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Medicamentos');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Comorbidades');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Pacientes');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Sair');
    expect(compiled.querySelector('header nav')?.textContent).not.toContain(
      'Recuperações de senha',
    );
    expect(compiled.querySelector('header nav')?.textContent).not.toContain('Cadastro');
    expect(compiled.querySelector('main[data-page="inicio"] h1')?.textContent).toContain(
      'Painel de atendimentos',
    );
    expect(compiled.querySelectorAll('[data-dashboard-card]').length).toBe(4);
    expect(compiled.querySelectorAll('ng-icon').length).toBeGreaterThanOrEqual(4);
    expect(
      compiled.querySelector('[data-chart="atendimentos-mes"] canvas[baseChart]'),
    ).toBeTruthy();
    expect(
      compiled.querySelector('[data-chart="tipos-atendimento"] canvas[baseChart]'),
    ).toBeTruthy();
    expect(
      compiled.querySelector('[data-chart="status-atendimentos"] canvas[baseChart]'),
    ).toBeTruthy();
  });

  it('should show administrative links only for the current ADMIN user', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/inicio');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).not.toContain(
      'Recuperações de senha',
    );
    expect(compiled.querySelector('header nav')?.textContent).not.toContain('Cadastros pendentes');
    expect(compiled.querySelector('header nav')?.textContent).not.toContain('Funcionários');

    authenticateAs('ADMIN');
    fixture.detectChanges();

    expect(compiled.querySelector('header nav')?.textContent).toContain('Recuperações de senha');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Cadastros pendentes');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Funcionários');
  });

  it('should log out and navigate to login from the internal shell', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/inicio');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector<HTMLButtonElement>('[data-action="logout"]');

    if (!logoutButton) {
      throw new Error('Expected logout action in internal navigation.');
    }

    logoutButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(logout).toHaveBeenCalledOnce();
    expect(currentUser()).toBeNull();
    expect(router.url).toBe('/login');
  });

  it('should block password recovery admin routes for non-admin roles', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    authenticateAs('FARMACEUTICO');

    await router.navigateByUrl('/admin/recuperacoes-senha');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(router.url).toBe('/inicio');
    expect(compiled.querySelector('main[data-page="admin-recuperacoes-senha"]')).toBeNull();
  });

  it('should block pharmacy employee admin routes for non-admin roles', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    authenticateAs('ESTAGIARIO');

    await router.navigateByUrl('/admin/funcionarios');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(router.url).toBe('/inicio');
    expect(compiled.querySelector('main[data-page="admin-funcionarios"]')).toBeNull();
  });

  it('should let ADMIN list and search pharmacy employees', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    authenticateAs('ADMIN');

    await router.navigateByUrl('/admin/funcionarios');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector<HTMLInputElement>('#employeeSearch');

    expect(compiled.querySelector('header nav')?.textContent).toContain('Funcionários');
    expect(
      compiled.querySelector('main[data-page="admin-funcionarios"] h1')?.textContent,
    ).toContain('Funcionários');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Marina Almeida');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Responsável técnico');
    expect(compiled.textContent).not.toContain('12345678901');
    expect(
      compiled.querySelector('[data-employee-actions]')?.querySelectorAll('ng-icon').length,
    ).toBe(1);
    expect(compiled.querySelector('[data-employee-actions]')?.textContent).not.toContain('Editar');

    if (!search) {
      throw new Error('Employee search input was not rendered.');
    }

    search.value = 'julia';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).toContain('Julia Ferreira');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Marina Almeida');
  });

  it('should render employee pagination controls with the default page size', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    authenticateAs('ADMIN');

    await router.navigateByUrl('/admin/funcionarios');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLSelectElement>('#employeePageSize')?.value).toBe('10');
    expect(compiled.querySelector('[data-pagination-summary="employees"]')?.textContent).toContain(
      'Exibindo 1-3 de 3',
    );
  });

  it('should show pharmacist details and confirm technical responsibility changes', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const employeeStore = TestBed.inject(TemporaryPharmacyEmployeeStore);
    const pharmacist = employeeStore
      .employees()
      .find((employee) => employee.role === 'FARMACEUTICO' && !employee.isTechnicalResponsible);

    if (!pharmacist || pharmacist.role === 'ESTAGIARIO') {
      throw new Error('Expected seeded pharmacist employee.');
    }

    authenticateAs('ADMIN');

    await router.navigateByUrl(`/admin/funcionarios/${pharmacist.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"] h1')?.textContent,
    ).toContain(pharmacist.name);
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).toContain('CRF');
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).toContain('Responsável técnico');
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).not.toContain('Tipo do estágio');

    compiled.querySelector<HTMLButtonElement>('button[data-toggle-technical-responsible]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Definir como responsável técnico',
    );

    compiled
      .querySelector<HTMLButtonElement>('button[data-confirm-technical-responsible]')
      ?.click();
    fixture.detectChanges();

    const updatedPharmacist = employeeStore.getEmployee(pharmacist.id);

    if (!updatedPharmacist || updatedPharmacist.role === 'ESTAGIARIO') {
      throw new Error('Expected updated pharmacist employee.');
    }

    expect(updatedPharmacist.isTechnicalResponsible).toBe(true);
    expect(compiled.querySelector('.alert-success')?.textContent).toContain(
      'Responsabilidade técnica atualizada',
    );
  });

  it('should show intern details without technical responsibility actions', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const employeeStore = TestBed.inject(TemporaryPharmacyEmployeeStore);
    const intern = employeeStore.employees().find((employee) => employee.role === 'ESTAGIARIO');

    if (!intern || intern.role !== 'ESTAGIARIO') {
      throw new Error('Expected seeded intern employee.');
    }

    authenticateAs('ADMIN');

    await router.navigateByUrl(`/admin/funcionarios/${intern.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"] h1')?.textContent,
    ).toContain(intern.name);
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).toContain('Tipo do estágio');
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).toContain('Supervisor');
    expect(
      compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent,
    ).not.toContain('CRF');
    expect(compiled.querySelector('button[data-toggle-technical-responsible]')).toBeNull();
  });

  it('should let ADMIN list, inspect, approve and reject password recovery requests', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const recoveryStore = TestBed.inject(TemporaryPasswordRecoveryStore);

    authenticateAs('ADMIN');
    const requestToApprove = recoveryStore.createRequest('aprovar@uem.br');
    const requestToReject = recoveryStore.createRequest('rejeitar@uem.br');

    await router.navigateByUrl('/admin/recuperacoes-senha');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Recuperações de senha');
    expect(
      compiled.querySelector('main[data-page="admin-recuperacoes-senha"] h1')?.textContent,
    ).toContain('Solicitações de recuperação de senha');
    expect(compiled.querySelector('tbody')?.textContent).toContain('aprovar@uem.br');
    expect(compiled.querySelector('tbody')?.textContent).toContain('PENDENTE');
    expect(compiled.textContent).not.toContain('__FORM_PASSWORD_VALUE__');
    expect(
      compiled.querySelector('[data-recovery-actions]')?.classList.contains('flex-nowrap'),
    ).toBe(true);
    expect(
      compiled.querySelector('[data-recovery-actions]')?.querySelectorAll('ng-icon').length,
    ).toBe(3);
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain(
      'Analisar',
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain('Aprovar');
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain(
      'Rejeitar',
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain('Editar');

    await router.navigateByUrl(`/admin/recuperacoes-senha/${requestToApprove.id}`);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      compiled.querySelector('main[data-page="visualizar-recuperacao-senha"] h1')?.textContent,
    ).toContain('aprovar@uem.br');
    expect(
      compiled.querySelector('main[data-page="visualizar-recuperacao-senha"]')?.textContent,
    ).not.toContain('Nova senha');

    await router.navigateByUrl('/admin/recuperacoes-senha');
    fixture.detectChanges();
    await fixture.whenStable();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-approve-recovery-id="${requestToApprove.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Aprovar recuperação de senha',
    );
    compiled.querySelector<HTMLButtonElement>('button[data-confirm-approve-recovery]')?.click();
    fixture.detectChanges();

    expect(recoveryStore.getRequest(requestToApprove.id)?.status).toBe('APROVADA');
    expect(compiled.querySelector('.alert-success')?.textContent).toContain('Solicitação aprovada');

    compiled
      .querySelector<HTMLButtonElement>(`button[data-reject-recovery-id="${requestToReject.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Rejeitar recuperação de senha',
    );
    compiled.querySelector<HTMLButtonElement>('button[data-confirm-reject-recovery]')?.click();
    fixture.detectChanges();

    expect(recoveryStore.getRequest(requestToReject.id)?.status).toBe('REJEITADA');
    expect(recoveryStore.pendingRequests()).toEqual([]);
  });

  it('should paginate password recovery requests with a default page size of 10', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const recoveryStore = TestBed.inject(TemporaryPasswordRecoveryStore);

    authenticateAs('ADMIN');

    for (let index = 1; index <= 12; index += 1) {
      recoveryStore.createRequest(`recuperacao-${index}@uem.br`);
    }

    await router.navigateByUrl('/admin/recuperacoes-senha');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLSelectElement>('#recoveryPageSize')?.value).toBe('10');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(10);
    expect(compiled.querySelector('[data-pagination-summary="recoveries"]')?.textContent).toContain(
      'Exibindo 1-10 de 12',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-next-page="recoveries"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(2);
    expect(compiled.querySelector('[data-pagination-summary="recoveries"]')?.textContent).toContain(
      'Exibindo 11-12 de 12',
    );
  });

  it('should list pharmaceutical service attendances with quick filters and pagination', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);

    attendanceStore.createAttendance({
      patient: {
        name: 'Maria Souza',
        cpf: '12345678901',
        birthDate: '1988-04-10',
        cellPhone: '44999999999',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '95',
        systolicPressure: '120',
        diastolicPressure: '80',
        bodyTemperature: '36.5',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });
    const waiting = attendanceStore.createAttendance({
      patient: {
        name: 'João Pereira',
        cpf: '98765432100',
        birthDate: '1970-09-20',
        cellPhone: '44977777777',
        gender: 'masculino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['inaloterapia'],
      care: null,
      injectable: null,
      inhalotherapy: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Soro fisiológico',
            batch: 'S1',
            expirationDate: '2027-04-04',
            dosage: 'Nebulização',
          },
        ],
        prescriberName: '',
        crmCro: '',
      },
      complementaryServices: null,
      followUp: {
        returnIntervalDays: 5,
        returnCount: 2,
      },
    });
    attendanceStore.markAttendanceExpired(waiting.id);

    await router.navigateByUrl('/atendimentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Atendimentos');
    expect(compiled.querySelector('main[data-page="atendimentos"] h1')?.textContent).toContain(
      'Atendimentos',
    );
    expect(compiled.querySelector('tbody')?.textContent).toContain('Maria Souza');
    expect(compiled.querySelector('tbody')?.textContent).toContain('123.456.789-01');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Expirado');
    expect(compiled.querySelector<HTMLSelectElement>('#attendancePageSize')?.value).toBe('10');
    expect(
      compiled.querySelector('[data-pagination-summary="attendances"]')?.textContent,
    ).toContain('Exibindo 1-2 de 2');

    compiled.querySelector<HTMLButtonElement>('button[data-status-filter="EXPIRADO"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('tbody')?.textContent).toContain('João Pereira');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Maria Souza');
    expect(
      compiled
        .querySelector('button[data-status-filter="EXPIRADO"]')
        ?.getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('should close expired attendances from the listing with confirmation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const attendance = attendanceStore.createAttendance({
      patient: {
        name: 'Carlos Lima',
        cpf: '55566677788',
        birthDate: '1981-05-05',
        cellPhone: '44933333333',
        gender: 'masculino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['servicos-farmaceuticos'],
      care: null,
      injectable: null,
      inhalotherapy: null,
      complementaryServices: {
        homeCare: false,
        pharmacotherapeuticFollowUp: true,
        minorDisorderIndication: false,
        signsAndSymptoms: 'Acompanhamento',
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Medicamento A',
            batch: 'A1',
            expirationDate: '2027-01-01',
            dosage: '1 vez ao dia',
          },
        ],
        recordNumber: '',
        attendanceDate: '2026-08-16',
      },
      followUp: {
        returnIntervalDays: 7,
        returnCount: 1,
      },
    });
    attendanceStore.markAttendanceExpired(attendance.id);

    await router.navigateByUrl('/atendimentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled
      .querySelector<HTMLButtonElement>(`button[data-close-attendance-id="${attendance.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Encerrar atendimento',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-confirm-close-attendance]')?.click();
    fixture.detectChanges();

    expect(attendanceStore.getAttendance(attendance.id)?.status).toBe('CONCLUIDO');
    expect(compiled.querySelector('.alert-success')?.textContent).toContain(
      'Atendimento encerrado',
    );
    expect(
      compiled.querySelector(`button[data-close-attendance-id="${attendance.id}"]`),
    ).toBeNull();
  });

  it('should continue a follow-up attendance from the listing as a new linked attendance', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const initialAttendance = attendanceStore.createAttendance({
      patient: {
        name: 'Carlos Lima',
        cpf: '55566677788',
        birthDate: '1981-05-05',
        cellPhone: '44933333333',
        gender: 'masculino',
        address: 'Rua A',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['servicos-farmaceuticos'],
      care: null,
      injectable: null,
      inhalotherapy: null,
      complementaryServices: {
        homeCare: false,
        pharmacotherapeuticFollowUp: true,
        minorDisorderIndication: false,
        signsAndSymptoms: 'Acompanhamento',
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Medicamento A',
            batch: 'A1',
            expirationDate: '2027-01-01',
            dosage: '1 vez ao dia',
          },
        ],
        recordNumber: '',
        attendanceDate: '2026-08-16',
      },
      followUp: {
        returnIntervalDays: 7,
        returnCount: 2,
      },
    });

    await router.navigateByUrl('/atendimentos');
    fixture.detectChanges();
    await fixture.whenStable();
    let compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('thead')?.textContent).toContain('Código');
    expect(compiled.querySelector('tbody')?.textContent).toContain(
      String(initialAttendance.codigo),
    );
    expect(
      compiled.querySelector(`[data-continue-attendance-id="${initialAttendance.id}"]`)
        ?.textContent,
    ).toContain('Prosseguir atendimento (1 de 2)');

    compiled
      .querySelector<HTMLElement>(`[data-continue-attendance-id="${initialAttendance.id}"]`)
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement as HTMLElement;

    expect(router.url).toBe(`/atendimentos/${initialAttendance.id}/continuar`);
    expect(
      compiled.querySelector('main[data-page="servicos-farmaceuticos"] h1')?.textContent,
    ).toContain('Continuar atendimento');
    expect(compiled.querySelector('[data-follow-up-context]')?.textContent).toContain(
      'Retorno 1 de 2',
    );
    expect(compiled.querySelector('[data-follow-up-context]')?.textContent).toContain(
      `Atendimento anterior: #${initialAttendance.codigo}`,
    );
    expect(compiled.querySelector<HTMLInputElement>('#cpfUsuario')?.value).toBe('555.666.777-88');
    expect(compiled.querySelector<HTMLInputElement>('#nomeUsuario')?.value).toBe('Carlos Lima');
    expect(compiled.querySelector('button[data-consult-patient]')).toBeNull();
    expect(compiled.querySelector('#acompanhamento')).toBeNull();

    compiled.querySelector<HTMLInputElement>('#enableCuidadosFarmaceuticos')?.click();
    fixture.detectChanges();
    const bloodGlucose = compiled.querySelector<HTMLInputElement>('#glicemiaCapilar');

    if (!bloodGlucose) {
      throw new Error('Blood glucose input was not rendered.');
    }

    bloodGlucose.value = '98';
    bloodGlucose.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const followUpReturn = attendanceStore.attendances()[0];

    expect(router.url).toBe('/atendimentos');
    expect(followUpReturn.id).not.toBe(initialAttendance.id);
    expect(followUpReturn.codigo).toBeGreaterThan(initialAttendance.codigo);
    expect(followUpReturn.patient.id).toBe(initialAttendance.patient.id);
    expect(followUpReturn.followUpLink?.previousAttendanceId).toBe(initialAttendance.id);
    expect(followUpReturn.followUpLink?.returnNumber).toBe(1);
    expect(followUpReturn.followUp).toEqual(initialAttendance.followUp);
    expect(followUpReturn.status).toBe('AGUARDANDO_RETORNO');
    expect(attendanceStore.getAttendance(initialAttendance.id)?.status).toBe('CONCLUIDO');
  });

  it('should search attendances advanced by selected medication and batch without matching different items', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = clinicalStore.createMedication({
      name: 'Dipirona',
      measurementUnit: '500 mg',
      administrationRoute: 'Oral',
    });
    const ibuprofeno = clinicalStore.createMedication({
      name: 'Ibuprofeno',
      measurementUnit: '400 mg',
      administrationRoute: 'Oral',
    });
    const matchingAttendance = attendanceStore.createAttendance({
      patient: {
        name: 'Carla Rocha',
        cpf: '22233344455',
        birthDate: '1980-03-03',
        cellPhone: '44955555555',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['aplicacao-injetaveis'],
      care: null,
      injectable: {
        medications: [
          {
            id: 'item-1',
            medicationId: dipirona.id,
            medicationConcentration: 'Dipirona — 500 mg',
            batch: 'AAA123',
            expirationDate: '2027-03-03',
            dosage: 'Dose única',
          },
          {
            id: 'item-2',
            medicationId: ibuprofeno.id,
            medicationConcentration: 'Ibuprofeno — 400 mg',
            batch: 'BBB999',
            expirationDate: '2027-03-03',
            dosage: 'Dose única',
          },
        ],
        administrationRoute: 'Intramuscular',
        prescriberName: '',
        crmCro: '',
      },
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });
    attendanceStore.createAttendance({
      patient: {
        name: 'Bruno Santos',
        cpf: '33344455566',
        birthDate: '1975-04-04',
        cellPhone: '44944444444',
        gender: 'masculino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['aplicacao-injetaveis'],
      care: null,
      injectable: {
        medications: [
          {
            id: 'item-3',
            medicationId: dipirona.id,
            medicationConcentration: 'Dipirona — 500 mg',
            batch: 'CCC123',
            expirationDate: '2027-04-04',
            dosage: 'Dose única',
          },
          {
            id: 'item-4',
            medicationId: ibuprofeno.id,
            medicationConcentration: 'Ibuprofeno — 400 mg',
            batch: 'AAA123',
            expirationDate: '2027-04-04',
            dosage: 'Dose única',
          },
        ],
        administrationRoute: 'Intramuscular',
        prescriberName: '',
        crmCro: '',
      },
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    await router.navigateByUrl('/atendimentos/busca-avancada');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="busca-avancada-atendimentos"] h1')?.textContent,
    ).toContain('Busca avançada de atendimentos');
    expect(compiled.querySelector('[data-advanced-search-initial]')?.textContent).toContain(
      'Utilize os filtros acima',
    );
    expect(compiled.querySelector('tbody')).toBeNull();

    const medicationInput = compiled.querySelector<HTMLInputElement>('#advancedMedication');
    const batchInput = compiled.querySelector<HTMLInputElement>('#advancedBatch');

    if (!medicationInput || !batchInput) {
      throw new Error('Advanced search fields were not rendered.');
    }

    medicationInput.value = 'dipi';
    medicationInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled
      .querySelector<HTMLButtonElement>(`button[data-select-medication-id="${dipirona.id}"]`)
      ?.click();
    batchInput.value = 'AAA123';
    batchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('button[data-submit-advanced-search]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[data-advanced-search-total]')?.textContent).toContain(
      '1 atendimento encontrado',
    );
    expect(compiled.querySelector('tbody')?.textContent).toContain(`#${matchingAttendance.codigo}`);
    expect(compiled.querySelector('tbody')?.textContent).toContain('Carla Rocha');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Dipirona — 500 mg');
    expect(compiled.querySelector('tbody')?.textContent).toContain('AAA123');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Bruno Santos');
    expect(
      compiled.querySelector('[data-pagination-summary="advanced-attendances"]')?.textContent,
    ).toContain('Exibindo 1-1 de 1');

    compiled
      .querySelector<HTMLAnchorElement>(`a[data-view-attendance-id="${matchingAttendance.id}"]`)
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe(`/atendimentos/${matchingAttendance.id}`);
  });

  it('should validate empty advanced search and clear filters/results', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    attendanceStore.createAttendance({
      patient: {
        name: 'Maria Souza',
        cpf: '12345678901',
        birthDate: '1988-04-10',
        cellPhone: '44999999999',
        gender: 'feminino',
        address: '',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '95',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    await router.navigateByUrl('/atendimentos/busca-avancada');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('button[data-submit-advanced-search]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-warning')?.textContent).toContain(
      'Informe ao menos um critério',
    );
    expect(compiled.querySelector('tbody')).toBeNull();

    const cpfInput = compiled.querySelector<HTMLInputElement>('#advancedCpf');

    if (!cpfInput) {
      throw new Error('CPF search field was not rendered.');
    }

    cpfInput.value = '12345678901';
    cpfInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(cpfInput.value).toBe('123.456.789-01');

    compiled.querySelector<HTMLButtonElement>('button[data-submit-advanced-search]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).toContain('Maria Souza');

    compiled.querySelector<HTMLButtonElement>('button[data-clear-advanced-search]')?.click();
    fixture.detectChanges();

    expect(cpfInput.value).toBe('');
    expect(compiled.querySelector('[data-advanced-search-initial]')?.textContent).toContain(
      'Utilize os filtros acima',
    );
    expect(compiled.querySelector('tbody')).toBeNull();
  });

  it('should show a read-only pharmaceutical service attendance detail page', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const attendance = attendanceStore.createAttendance({
      patient: {
        name: 'Bruna Santos',
        cpf: '44455566677',
        birthDate: '1990-06-06',
        cellPhone: '44922222222',
        gender: 'feminino',
        address: 'Rua A',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['inaloterapia'],
      care: null,
      injectable: null,
      inhalotherapy: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Soro fisiológico',
            batch: 'L1',
            expirationDate: '2027-01-01',
            dosage: 'Nebulização',
          },
        ],
        prescriberName: 'Dra. Ana',
        crmCro: 'CRM 123',
      },
      complementaryServices: null,
      followUp: {
        returnIntervalDays: 7,
        returnCount: 3,
      },
    });

    await router.navigateByUrl(`/atendimentos/${attendance.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"] h1')?.textContent,
    ).toContain('Bruna Santos');
    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent,
    ).toContain('Aguardando retorno');
    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent,
    ).toContain('Inaloterapia');
    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent,
    ).toContain('Soro fisiológico');
    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent,
    ).toContain('Retornar a cada 7 dias, 3 vezes');
    expect(compiled.querySelector('form')).toBeNull();
  });

  it('should show business code and follow-up history in attendance details', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const initialAttendance = attendanceStore.createAttendance({
      patient: {
        name: 'Bruna Santos',
        cpf: '44455566677',
        birthDate: '1990-06-06',
        cellPhone: '44922222222',
        gender: 'feminino',
        address: 'Rua A',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['inaloterapia'],
      care: null,
      injectable: null,
      inhalotherapy: {
        medications: [
          {
            id: 'item-1',
            medicationConcentration: 'Soro fisiológico',
            batch: 'S1',
            expirationDate: '2027-01-01',
            dosage: 'Nebulização',
          },
        ],
        prescriberName: 'Dra. Ana',
        crmCro: 'CRM 123',
      },
      complementaryServices: null,
      followUp: {
        returnIntervalDays: 7,
        returnCount: 2,
      },
    });
    const firstReturn = attendanceStore.createFollowUpReturn(initialAttendance.id, {
      patient: initialAttendance.patient,
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '98',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    await router.navigateByUrl(`/atendimentos/${firstReturn!.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="visualizar-atendimento"] h1')?.textContent,
    ).toContain(`#${firstReturn?.codigo}`);
    expect(compiled.querySelector('[data-attendance-code]')?.textContent).toContain(
      String(firstReturn?.codigo),
    );
    expect(compiled.querySelector('[data-follow-up-history]')?.textContent).toContain(
      'Atendimento inicial',
    );
    expect(compiled.querySelector('[data-follow-up-history]')?.textContent).toContain('1º retorno');
    expect(compiled.querySelector('[data-follow-up-history]')?.textContent).toContain('2º retorno');
    expect(compiled.querySelector('[data-follow-up-history]')?.textContent).toContain('Pendente');
    expect(
      compiled.querySelector(`[data-follow-up-history-link="${initialAttendance.id}"]`),
    ).toBeTruthy();
  });

  it('should render the pharmaceutical services form with patient lookup and optional steps', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);

    attendanceStore.createAttendance({
      patient: {
        name: 'Paciente Existente',
        cpf: '10120230344',
        birthDate: '1992-02-02',
        cellPhone: '44911111111',
        gender: 'feminino',
        address: 'Rua Existente',
        city: 'Maringá',
        state: 'PR',
        phone: '',
        responsibleName: '',
      },
      selectedServices: ['cuidados-farmaceuticos'],
      care: {
        bloodGlucose: '90',
        systolicPressure: '',
        diastolicPressure: '',
        bodyTemperature: '',
      },
      injectable: null,
      inhalotherapy: null,
      complementaryServices: null,
      followUp: null,
    });

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="servicos-farmaceuticos"] h1')?.textContent,
    ).toContain('Novo atendimento');
    expect(
      compiled.querySelector('main[data-page="servicos-farmaceuticos"] p.leading-6')?.textContent,
    ).toContain('Estes procedimentos não substituem consulta médica ou exames laboratoriais.');
    expect(compiled.querySelectorAll('[data-service-step]').length).toBe(6);
    expect(compiled.querySelector('#identificacao-usuario')).toBeTruthy();
    expect(compiled.querySelector('#cuidados-farmaceuticos')).toBeTruthy();
    expect(compiled.querySelector('#aplicacao-injetaveis')).toBeTruthy();
    expect(compiled.querySelector('#inaloterapia')).toBeTruthy();
    expect(compiled.querySelector('#servicos-acompanhamento')).toBeTruthy();
    expect(compiled.querySelector('#acompanhamento')).toBeTruthy();
    expect(compiled.querySelector('#revisao-assinatura')).toBeNull();
    expect(compiled.querySelector('#cuidados-farmaceuticos .card-description')).toBeNull();
    expect(compiled.querySelector('label[for="nomeUsuario"]')?.textContent).toContain('Nome');
    expect(compiled.querySelector('label[for="cpfUsuario"]')?.textContent).toContain('CPF');
    expect(compiled.querySelector('label[for="dataNascimentoUsuario"]')?.textContent).toContain(
      'Data de nascimento',
    );
    expect(compiled.querySelector('label[for="idadeUsuario"]')).toBeNull();
    expect(compiled.querySelector('section#cuidados-farmaceuticos [data-step-content]')).toBeNull();

    const cpf = compiled.querySelector<HTMLInputElement>('#cpfUsuario');

    if (!cpf) {
      throw new Error('CPF input was not rendered.');
    }

    cpf.value = '10120230344';
    cpf.dispatchEvent(new Event('input'));
    compiled.querySelector<HTMLButtonElement>('button[data-consult-patient]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector<HTMLInputElement>('#nomeUsuario')?.value).toBe(
      'Paciente Existente',
    );
    expect(compiled.querySelector('.alert-info')?.textContent).toContain('Paciente encontrado');

    compiled.querySelector<HTMLInputElement>('#enableInaloterapia')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('section#inaloterapia [data-step-content]')).toBeTruthy();
    expect(compiled.querySelector('label[for="medicamentoInaloterapia"]')?.textContent).toContain(
      'Medicamento/concentração',
    );

    compiled.querySelector<HTMLInputElement>('#enableAcompanhamento')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('section#acompanhamento [data-step-content]')).toBeTruthy();
    expect(compiled.querySelector('label[for="intervaloRetornos"]')?.textContent).toContain(
      'Intervalo para retorno',
    );
  });

  it('should create an attendance with multiple medications and follow-up from the form', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const soro = clinicalStore.createMedication({
      name: 'Soro fisiológico',
      measurementUnit: '0,9%',
      administrationRoute: 'Inalatória',
    });
    const broncodilatador = clinicalStore.createMedication({
      name: 'Broncodilatador',
      measurementUnit: '2,5 mg',
      administrationRoute: 'Inalatória',
    });

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
    };

    setInput('#cpfUsuario', '77788899900');
    compiled.querySelector<HTMLButtonElement>('button[data-consult-patient]')?.click();
    fixture.detectChanges();
    setInput('#nomeUsuario', 'Novo Paciente');
    setInput('#dataNascimentoUsuario', '1985-08-08');
    setInput('#celularUsuario', '44900000000');
    setInput('#cidadeUsuario', 'Maringá');
    const state = compiled.querySelector<HTMLSelectElement>('#estadoUsuario');

    if (!state) {
      throw new Error('State select was not rendered.');
    }

    state.value = 'PR';
    state.dispatchEvent(new Event('change'));

    compiled.querySelector<HTMLInputElement>('#enableInaloterapia')?.click();
    fixture.detectChanges();

    setInput('#medicamentoInaloterapia', 'soro');
    fixture.detectChanges();
    compiled
      .querySelector<HTMLButtonElement>(`button[data-select-medication-id="${soro.id}"]`)
      ?.click();
    fixture.detectChanges();
    setInput('#loteInaloterapia', 'L1');
    setInput('#validadeInaloterapia', '2027-01-01');
    setInput('#posologiaInaloterapia', 'Nebulização');
    compiled
      .querySelector<HTMLButtonElement>('button[data-add-medication="inaloterapia"]')
      ?.click();
    fixture.detectChanges();

    setInput('#medicamentoInaloterapia', 'bronco');
    fixture.detectChanges();
    compiled
      .querySelector<HTMLButtonElement>(`button[data-select-medication-id="${broncodilatador.id}"]`)
      ?.click();
    fixture.detectChanges();
    setInput('#loteInaloterapia', 'L2');
    setInput('#validadeInaloterapia', '2027-02-02');
    setInput('#posologiaInaloterapia', 'Conforme prescrição');
    compiled
      .querySelector<HTMLButtonElement>('button[data-add-medication="inaloterapia"]')
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-medication-item="inaloterapia"]').length).toBe(2);

    compiled.querySelector<HTMLInputElement>('#enableAcompanhamento')?.click();
    fixture.detectChanges();
    setInput('#intervaloRetornos', '7');
    setInput('#quantidadeRetornos', '3');
    fixture.detectChanges();

    expect(compiled.querySelector('[data-follow-up-preview]')?.textContent).toContain(
      'O paciente deverá retornar a cada 7 dias, 3 vezes.',
    );

    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain(
      'Salvar atendimento',
    );

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const attendance = attendanceStore.attendances()[0];

    expect(router.url).toBe('/atendimentos');
    expect(attendance.patient.name).toBe('Novo Paciente');
    expect(attendance.status).toBe('AGUARDANDO_RETORNO');
    expect(attendance.inhalotherapy?.medications).toHaveLength(2);
    expect(attendance.inhalotherapy?.medications[0].medicationId).toBe(soro.id);
    expect(attendance.followUp?.returnIntervalDays).toBe(7);
  });

  it('should mask CPF, phone and CEP while storing normalized patient data', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): HTMLInputElement => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      return input;
    };

    expect(setInput('#cpfUsuario', '77788899900').value).toBe('777.888.999-00');
    expect(setInput('#celularUsuario', '44900000000').value).toBe('(44) 90000-0000');
    expect(setInput('#cepUsuario', '87020025').value).toBe('87020-025');

    setInput('#nomeUsuario', 'Paciente Máscara');
    setInput('#dataNascimentoUsuario', '1985-08-08');

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const attendance = attendanceStore.attendances()[0];

    expect(attendance.patient.cpf).toBe('77788899900');
    expect(attendance.patient.cellPhone).toBe('44900000000');
    expect(attendance.patient.cep).toBe('87020025');
  });

  it('should fill address from ViaCEP and keep manual filling available when CEP is not found', async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('87020025')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              cep: '87020-025',
              logradouro: 'Avenida Colombo',
              bairro: 'Zona 7',
              localidade: 'Maringá',
              uf: 'PR',
            }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ erro: true }),
      } as Response);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      const fixture = TestBed.createComponent(App);
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/atendimentos/novo');
      fixture.detectChanges();
      await fixture.whenStable();
      const compiled = fixture.nativeElement as HTMLElement;
      const cep = compiled.querySelector<HTMLInputElement>('#cepUsuario');

      if (!cep) {
        throw new Error('CEP input was not rendered.');
      }

      cep.value = '87020025';
      cep.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(compiled.querySelector<HTMLInputElement>('#enderecoUsuario')?.value).toBe(
        'Avenida Colombo',
      );
      expect(compiled.querySelector<HTMLInputElement>('#bairroUsuario')?.value).toBe('Zona 7');
      expect(compiled.querySelector<HTMLInputElement>('#cidadeUsuario')?.value).toBe('Maringá');
      expect(compiled.querySelector<HTMLSelectElement>('#estadoUsuario')?.value).toBe('PR');
      expect(compiled.querySelector('[data-cep-feedback]')?.textContent ?? '').not.toContain(
        'não pôde ser preenchido automaticamente',
      );

      const unknownCep = compiled.querySelector<HTMLInputElement>('#cepUsuario');
      unknownCep!.value = '99999999';
      unknownCep!.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 10));
      fixture.detectChanges();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[1][0])).toContain('99999999');
      expect(compiled.querySelector('[data-cep-feedback]')?.textContent).toContain(
        'não pôde ser preenchido automaticamente',
      );

      const address = compiled.querySelector<HTMLInputElement>('#enderecoUsuario');
      address!.value = 'Rua Manual';
      address!.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(address?.value).toBe('Rua Manual');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should require selecting registered medications in service medication fields', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const attendanceStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    clinicalStore.createMedication({
      name: 'Dipirona',
      measurementUnit: '500 mg',
      administrationRoute: 'Oral',
    });

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    compiled.querySelector<HTMLInputElement>('#enableAplicacaoInjetaveis')?.click();
    fixture.detectChanges();

    setInput('#medicamentoInjetavel', 'texto livre');
    setInput('#loteInjetavel', 'L1');
    setInput('#validadeInjetavel', '2027-01-01');
    setInput('#posologiaInjetavel', 'Dose única');
    compiled.querySelector<HTMLButtonElement>('button[data-add-medication="injectable"]')?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-field-error="injectable-medication"]')?.textContent,
    ).toContain('Selecione um medicamento cadastrado.');
    expect(compiled.querySelectorAll('[data-medication-item="injectable"]').length).toBe(0);

    setInput('#medicamentoInjetavel', 'dipi');

    expect(compiled.querySelector('[data-medication-options="injectable"]')?.textContent).toContain(
      'Dipirona',
    );
    expect(attendanceStore.attendances()).toHaveLength(0);
  });

  it('should show medication draft validation errors in all medication service steps', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = clinicalStore.createMedication({
      name: 'Dipirona',
      measurementUnit: '500 mg',
      administrationRoute: 'Oral',
    });

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const enableAndSelectMedication = (enableSelector: string, inputSelector: string): void => {
      compiled.querySelector<HTMLInputElement>(enableSelector)?.click();
      fixture.detectChanges();
      setInput(inputSelector, 'dipi');
      compiled
        .querySelector<HTMLButtonElement>(`button[data-select-medication-id="${dipirona.id}"]`)
        ?.click();
      fixture.detectChanges();
    };

    enableAndSelectMedication('#enableAplicacaoInjetaveis', '#medicamentoInjetavel');
    compiled.querySelector<HTMLButtonElement>('button[data-add-medication="injectable"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[data-field-error="injectable-batch"]')?.textContent).toContain(
      'Informe o lote.',
    );
    expect(
      compiled.querySelector('[data-field-error="injectable-expiration-date"]')?.textContent,
    ).toContain('Informe a validade.');
    expect(compiled.querySelector('[data-field-error="injectable-dosage"]')?.textContent).toContain(
      'Informe a posologia.',
    );

    enableAndSelectMedication('#enableInaloterapia', '#medicamentoInaloterapia');
    compiled
      .querySelector<HTMLButtonElement>('button[data-add-medication="inaloterapia"]')
      ?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-field-error="inhalotherapy-batch"]')?.textContent,
    ).toContain('Informe o lote.');
    expect(
      compiled.querySelector('[data-field-error="inhalotherapy-expiration-date"]')?.textContent,
    ).toContain('Informe a validade.');
    expect(
      compiled.querySelector('[data-field-error="inhalotherapy-dosage"]')?.textContent,
    ).toContain('Informe a posologia.');

    enableAndSelectMedication('#enableServicosFarmaceuticos', '#medicamentoAcompanhamento');
    compiled
      .querySelector<HTMLButtonElement>('button[data-add-medication="complementary"]')
      ?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-field-error="complementary-batch"]')?.textContent,
    ).toContain('Informe o lote.');
    expect(
      compiled.querySelector('[data-field-error="complementary-expiration-date"]')?.textContent,
    ).toContain('Informe a validade.');
    expect(
      compiled.querySelector('[data-field-error="complementary-dosage"]')?.textContent,
    ).toContain('Informe a posologia.');
  });

  it('should show non-blocking warnings for values above reference ranges', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    compiled.querySelector<HTMLInputElement>('#enableCuidadosFarmaceuticos')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[data-field-warning="systolic-pressure"]')).toBeNull();
    expect(compiled.querySelector('[data-field-warning="diastolic-pressure"]')).toBeNull();
    expect(compiled.querySelector('[data-vital-signs-grid]')?.className).toContain('items-start');

    setInput('#glicemiaCapilar', '111');
    setInput('#pressaoSistolica', '121');
    setInput('#pressaoDiastolica', '81');
    setInput('#temperaturaCorporal', '37.1');

    expect(compiled.querySelector('[data-field-warning="blood-glucose"]')?.textContent).toContain(
      '80 a 110 mg/dL',
    );
    expect(
      compiled.querySelector('[data-field-warning="systolic-pressure"]')?.textContent,
    ).toContain('A pressão sistólica está maior que o valor de referência (120 mmHg)');
    expect(
      compiled.querySelector('[data-field-warning="diastolic-pressure"]')?.textContent,
    ).toContain('A pressão diastólica está maior que o valor de referência (80 mmHg)');
    expect(
      compiled.querySelector('[data-field-warning="body-temperature"]')?.textContent,
    ).toContain('36 °C a 37 °C');

    setInput('#glicemiaCapilar', '110');
    setInput('#pressaoSistolica', '120');
    setInput('#pressaoDiastolica', '80');
    setInput('#temperaturaCorporal', '37');

    expect(compiled.querySelector('[data-field-warning="blood-glucose"]')).toBeNull();
    expect(compiled.querySelector('[data-field-warning="systolic-pressure"]')).toBeNull();
    expect(compiled.querySelector('[data-field-warning="diastolic-pressure"]')).toBeNull();
    expect(compiled.querySelector('[data-field-warning="body-temperature"]')).toBeNull();

    setInput('#pressaoSistolica', '119');
    setInput('#pressaoDiastolica', '79');

    expect(
      compiled.querySelector('[data-field-warning="systolic-pressure"]')?.textContent,
    ).toContain('A pressão sistólica está menor que o valor de referência (120 mmHg)');
    expect(
      compiled.querySelector('[data-field-warning="diastolic-pressure"]')?.textContent,
    ).toContain('A pressão diastólica está menor que o valor de referência (80 mmHg)');
    expect(compiled.querySelector('[data-field-warning="blood-pressure"]')).toBeNull();
    expect(
      compiled.querySelector('main[data-page="servicos-farmaceuticos"]')?.textContent,
    ).not.toContain('Valor de referência registrado apenas como apoio visual.');
  });

  it('should render the medications route from internal navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/medicamentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Medicamentos');
    expect(compiled.querySelector('a[routerLink="/medicamentos"]')?.textContent).toContain(
      'Medicamentos',
    );
    expect(compiled.querySelector('main[data-page="medicamentos"] h1')?.textContent).toContain(
      'Medicamentos',
    );
  });

  it('should show an empty medication state with a new medication action', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/medicamentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.empty-title')?.textContent).toContain(
      'Nenhum medicamento cadastrado',
    );
    expect(compiled.querySelector('a[routerLink="/medicamentos/novo"]')?.textContent).toContain(
      'Cadastrar medicamento',
    );
  });

  it('should validate and create a medication from the medication form', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/medicamentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[data-field-error="medication-name"]')?.textContent).toContain(
      'Nome do medicamento é obrigatório',
    );

    const name = compiled.querySelector<HTMLInputElement>('#medicationName');
    const unit = compiled.querySelector<HTMLInputElement>('#measurementUnit');
    const routeInput = compiled.querySelector<HTMLInputElement>('#administrationRoute');

    if (!name || !unit || !routeInput) {
      throw new Error('Medication form inputs were not rendered.');
    }

    name.value = 'Dipirona';
    name.dispatchEvent(new Event('input'));
    unit.value = 'mg';
    unit.dispatchEvent(new Event('input'));
    routeInput.value = 'Oral';
    routeInput.dispatchEvent(new Event('input'));

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/medicamentos');
    expect(compiled.querySelector('main[data-page="medicamentos"]')?.textContent).toContain(
      'Dipirona',
    );
    expect(compiled.querySelector('main[data-page="medicamentos"]')?.textContent).toContain('mg');
    expect(compiled.querySelector('main[data-page="medicamentos"]')?.textContent).toContain('Oral');
  });

  it('should search, view and delete a medication with confirmation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutânea',
    });

    await router.navigateByUrl('/medicamentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector<HTMLInputElement>('#medicationSearch');

    if (!search) {
      throw new Error('Medication search input was not rendered.');
    }

    search.value = 'dipi';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).toContain('Dipirona');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Insulina');
    expect(
      compiled.querySelector('[data-medication-actions]')?.classList.contains('flex-nowrap'),
    ).toBe(true);
    expect(compiled.querySelectorAll('[data-medication-actions] ng-icon').length).toBe(3);
    expect(compiled.querySelector('[data-medication-actions]')?.textContent).not.toContain(
      'Visualizar',
    );
    expect(compiled.querySelector('[data-medication-actions]')?.textContent).not.toContain(
      'Editar',
    );
    expect(compiled.querySelector('[data-medication-actions]')?.textContent).not.toContain(
      'Excluir',
    );

    await router.navigateByUrl(`/medicamentos/${dipirona.id}`);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      compiled.querySelector('main[data-page="visualizar-medicamento"] h1')?.textContent,
    ).toContain('Dipirona');
    expect(
      compiled.querySelector('main[data-page="visualizar-medicamento"]')?.textContent,
    ).toContain('Concentração');
    expect(compiled.querySelector('form')).toBeNull();

    await router.navigateByUrl('/medicamentos');
    fixture.detectChanges();
    await fixture.whenStable();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-delete-medication-id="${dipirona.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Excluir medicamento',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-confirm-delete-medication]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Dipirona');
    expect(store.getMedication(dipirona.id)).toBeUndefined();
  });

  it('should edit an existing medication and reflect changes in the listing', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);
    const medication = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });

    await router.navigateByUrl(`/medicamentos/${medication.id}/editar`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="editar-medicamento"] h1')?.textContent,
    ).toContain('Editar medicamento');

    const name = compiled.querySelector<HTMLInputElement>('#medicationName');
    const concentration = compiled.querySelector<HTMLInputElement>('#measurementUnit');

    if (!name || !concentration) {
      throw new Error('Medication edit inputs were not rendered.');
    }

    expect(name.value).toBe('Dipirona');
    expect(concentration.value).toBe('mg');

    name.value = 'Dipirona gotas';
    name.dispatchEvent(new Event('input'));
    concentration.value = 'ml';
    concentration.dispatchEvent(new Event('input'));

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/medicamentos');
    expect(compiled.querySelector('main[data-page="medicamentos"]')?.textContent).toContain(
      'Dipirona gotas',
    );
    expect(compiled.querySelector('main[data-page="medicamentos"]')?.textContent).toContain('ml');
    expect(store.getMedication(medication.id)?.name).toBe('Dipirona gotas');
  });

  it('should paginate medications and reset to the first page when searching', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);

    for (let index = 1; index <= 12; index += 1) {
      store.createMedication({
        name: `Medicamento ${index}`,
        measurementUnit: 'mg',
        administrationRoute: 'Oral',
      });
    }

    await router.navigateByUrl('/medicamentos');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector<HTMLSelectElement>('#medicationPageSize')?.value).toBe('10');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(10);
    expect(
      compiled.querySelector('[data-pagination-summary="medications"]')?.textContent,
    ).toContain('Exibindo 1-10 de 12');

    compiled.querySelector<HTMLButtonElement>('button[data-next-page="medications"]')?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-pagination-summary="medications"]')?.textContent,
    ).toContain('Exibindo 11-12 de 12');

    const search = compiled.querySelector<HTMLInputElement>('#medicationSearch');

    if (!search) {
      throw new Error('Medication search input was not rendered.');
    }

    search.value = 'Medicamento 12';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(
      compiled.querySelector('[data-pagination-summary="medications"]')?.textContent,
    ).toContain('Exibindo 1-1 de 1');
  });

  it('should render the comorbidities route from internal navigation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/comorbidades');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Comorbidades');
    expect(compiled.querySelector('a[routerLink="/comorbidades"]')?.textContent).toContain(
      'Comorbidades',
    );
    expect(compiled.querySelector('main[data-page="comorbidades"] h1')?.textContent).toContain(
      'Comorbidades',
    );
  });

  it('should show an empty comorbidity state with a new comorbidity action', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/comorbidades');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.empty-title')?.textContent).toContain(
      'Nenhuma comorbidade cadastrada',
    );
    expect(compiled.querySelector('a[routerLink="/comorbidades/nova"]')?.textContent).toContain(
      'Cadastrar comorbidade',
    );
  });

  it('should validate and create a comorbidity with searchable medication interactions', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const insulina = store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutânea',
    });

    await router.navigateByUrl('/comorbidades/nova');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('[data-field-error="comorbidity-name"]')?.textContent).toContain(
      'Nome da comorbidade é obrigatório',
    );

    const name = compiled.querySelector<HTMLInputElement>('#comorbidityName');
    const interactionSearch = compiled.querySelector<HTMLInputElement>(
      '#interactionMedicationSearch',
    );

    if (!name || !interactionSearch) {
      throw new Error('Comorbidity form inputs were not rendered.');
    }

    name.value = 'Diabetes mellitus';
    name.dispatchEvent(new Event('input'));

    interactionSearch.value = 'dipi';
    interactionSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-interaction-id="${dipirona.id}"]`)
      ?.click();
    fixture.detectChanges();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-interaction-id="${dipirona.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(1);

    compiled
      .querySelector<HTMLButtonElement>(`button[data-remove-interaction-id="${dipirona.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(0);

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-interaction-id="${dipirona.id}"]`)
      ?.click();

    interactionSearch.value = 'insu';
    interactionSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-interaction-id="${insulina.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(2);

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/comorbidades');
    expect(compiled.querySelector('main[data-page="comorbidades"]')?.textContent).toContain(
      'Diabetes mellitus',
    );
    expect(compiled.querySelector('main[data-page="comorbidades"]')?.textContent).toContain(
      '2 interação(ões)',
    );
  });

  it('should search, view and delete a comorbidity with confirmation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const diabetes = store.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });
    store.createComorbidity({
      name: 'Hipertensão',
      medicationInteractionIds: [],
    });

    await router.navigateByUrl('/comorbidades');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector<HTMLInputElement>('#comorbiditySearch');

    if (!search) {
      throw new Error('Comorbidity search input was not rendered.');
    }

    search.value = 'diabetes';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).toContain('Diabetes mellitus');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Hipertensão');
    expect(
      compiled.querySelector('[data-comorbidity-actions]')?.classList.contains('flex-nowrap'),
    ).toBe(true);
    expect(compiled.querySelectorAll('[data-comorbidity-actions] ng-icon').length).toBe(3);
    expect(compiled.querySelector('[data-comorbidity-actions]')?.textContent).not.toContain(
      'Visualizar',
    );
    expect(compiled.querySelector('[data-comorbidity-actions]')?.textContent).not.toContain(
      'Editar',
    );
    expect(compiled.querySelector('[data-comorbidity-actions]')?.textContent).not.toContain(
      'Excluir',
    );

    await router.navigateByUrl(`/comorbidades/${diabetes.id}`);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      compiled.querySelector('main[data-page="visualizar-comorbidade"] h1')?.textContent,
    ).toContain('Diabetes mellitus');
    expect(
      compiled.querySelector('main[data-page="visualizar-comorbidade"]')?.textContent,
    ).toContain('Dipirona');
    expect(compiled.querySelector('form')).toBeNull();

    await router.navigateByUrl('/comorbidades');
    fixture.detectChanges();
    await fixture.whenStable();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-delete-comorbidity-id="${diabetes.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Excluir comorbidade',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-confirm-delete-comorbidity]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Diabetes mellitus');
    expect(store.getComorbidity(diabetes.id)).toBeUndefined();
  });

  it('should edit an existing comorbidity while preserving and changing interactions', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = store.createMedication({
      name: 'Dipirona',
      measurementUnit: 'mg',
      administrationRoute: 'Oral',
    });
    const insulina = store.createMedication({
      name: 'Insulina',
      measurementUnit: 'dose',
      administrationRoute: 'Subcutânea',
    });
    const comorbidity = store.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });

    await router.navigateByUrl(`/comorbidades/${comorbidity.id}/editar`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(
      compiled.querySelector('main[data-page="editar-comorbidade"] h1')?.textContent,
    ).toContain('Editar comorbidade');
    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(1);
    expect(compiled.querySelector('[data-selected-interaction-id]')?.textContent).toContain(
      'Dipirona',
    );

    const name = compiled.querySelector<HTMLInputElement>('#comorbidityName');
    const interactionSearch = compiled.querySelector<HTMLInputElement>(
      '#interactionMedicationSearch',
    );

    if (!name || !interactionSearch) {
      throw new Error('Comorbidity edit inputs were not rendered.');
    }

    name.value = 'Diabetes tipo 2';
    name.dispatchEvent(new Event('input'));
    interactionSearch.value = 'insu';
    interactionSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-interaction-id="${insulina.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(2);

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/comorbidades');
    expect(compiled.querySelector('main[data-page="comorbidades"]')?.textContent).toContain(
      'Diabetes tipo 2',
    );
    expect(compiled.querySelector('main[data-page="comorbidades"]')?.textContent).toContain(
      '2 interação(ões)',
    );
    expect(store.getComorbidity(comorbidity.id)?.medicationInteractionIds).toEqual([
      dipirona.id,
      insulina.id,
    ]);
  });

  it('should paginate comorbidities and allow changing page size', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const store = TestBed.inject(TemporaryClinicalRecordsStore);

    for (let index = 1; index <= 12; index += 1) {
      store.createComorbidity({
        name: `Comorbidade ${index}`,
        medicationInteractionIds: [],
      });
    }

    await router.navigateByUrl('/comorbidades');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const pageSize = compiled.querySelector<HTMLSelectElement>('#comorbidityPageSize');

    expect(pageSize?.value).toBe('10');
    expect(compiled.querySelectorAll('tbody tr').length).toBe(10);

    if (!pageSize) {
      throw new Error('Comorbidity page size select was not rendered.');
    }

    pageSize.value = '20';
    pageSize.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(12);
    expect(
      compiled.querySelector('[data-pagination-summary="comorbidities"]')?.textContent,
    ).toContain('Exibindo 1-12 de 12');
  });

  it('should list, create, view and edit patients with comorbidities', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const patientStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const diabetes = clinicalStore.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [],
    });

    await router.navigateByUrl('/pacientes');
    fixture.detectChanges();
    await fixture.whenStable();
    let compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a[routerLink="/pacientes"]')?.textContent).toContain(
      'Pacientes',
    );
    expect(compiled.querySelector('.empty-title')?.textContent).toContain(
      'Nenhum paciente cadastrado',
    );

    await router.navigateByUrl('/pacientes/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): HTMLInputElement => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      return input;
    };

    expect(compiled.querySelector('main[data-page="novo-paciente"] h1')?.textContent).toContain(
      'Novo paciente',
    );
    expect(setInput('#cpfUsuario', '12345678901').value).toBe('123.456.789-01');
    setInput('#nomeUsuario', 'Maria Souza');
    setInput('#dataNascimentoUsuario', '1988-04-10');
    setInput('#celularUsuario', '44999999999');
    setInput('#cidadeUsuario', 'Maringá');
    const state = compiled.querySelector<HTMLSelectElement>('#estadoUsuario');

    if (!state) {
      throw new Error('State select was not rendered.');
    }

    state.value = 'PR';
    state.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toContain('/pacientes/');
    expect(router.url).toContain('/editar');
    expect(compiled.querySelector('main[data-page="editar-paciente"] h1')?.textContent).toContain(
      'Editar paciente',
    );

    const comorbiditySearch = compiled.querySelector<HTMLInputElement>('#patientComorbiditySearch');

    if (!comorbiditySearch) {
      throw new Error('Patient comorbidity search was not rendered.');
    }

    comorbiditySearch.value = 'diabetes';
    comorbiditySearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-patient-comorbidity-id="${diabetes.id}"]`)
      ?.click();
    fixture.detectChanges();
    compiled
      .querySelector<HTMLButtonElement>(`button[data-add-patient-comorbidity-id="${diabetes.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('[data-selected-patient-comorbidity-id]').length).toBe(1);

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/pacientes');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Maria Souza');
    expect(compiled.querySelector('tbody')?.textContent).toContain('1 comorbidade(s)');

    const patient = patientStore.patients()[0];
    await router.navigateByUrl(`/pacientes/${patient.id}`);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      compiled.querySelector('main[data-page="visualizar-paciente"] h1')?.textContent,
    ).toContain('Maria Souza');
    expect(compiled.querySelector('main[data-page="visualizar-paciente"]')?.textContent).toContain(
      'Diabetes mellitus',
    );
    expect(compiled.querySelector('form')).toBeNull();
  });

  it('should show non-blocking medication-comorbidity warnings during pharmaceutical services', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const patientStore = TestBed.inject(TemporaryPharmaceuticalServiceStore);
    const clinicalStore = TestBed.inject(TemporaryClinicalRecordsStore);
    const dipirona = clinicalStore.createMedication({
      name: 'Dipirona',
      measurementUnit: '500 mg',
      administrationRoute: 'Oral',
    });
    const diabetes = clinicalStore.createComorbidity({
      name: 'Diabetes mellitus',
      medicationInteractionIds: [dipirona.id],
    });

    patientStore.createPatient({
      name: 'Paciente Comorbidade',
      cpf: '10120230344',
      birthDate: '1992-02-02',
      cellPhone: '44911111111',
      gender: 'feminino',
      address: '',
      city: 'Maringá',
      state: 'PR',
      phone: '',
      responsibleName: '',
      comorbidityIds: [diabetes.id],
    });

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const setInput = (selector: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(selector);

      if (!input) {
        throw new Error(`${selector} was not rendered.`);
      }

      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    setInput('#cpfUsuario', '10120230344');
    compiled.querySelector<HTMLButtonElement>('button[data-consult-patient]')?.click();
    fixture.detectChanges();
    compiled.querySelector<HTMLInputElement>('#enableAplicacaoInjetaveis')?.click();
    fixture.detectChanges();
    setInput('#medicamentoInjetavel', 'dipi');
    compiled
      .querySelector<HTMLButtonElement>(`button[data-select-medication-id="${dipirona.id}"]`)
      ?.click();
    fixture.detectChanges();

    expect(
      compiled.querySelector('[data-medication-interaction-warning="injectable"]')?.textContent,
    ).toContain(
      'A medicação Dipirona interage com uma comorbidade do paciente: Diabetes mellitus. Ministre a medicação com cautela.',
    );
    expect(
      compiled.querySelector('[data-medication-interaction-warning="injectable"]'),
    ).toBeTruthy();
  });

  function authenticateAs(role: AuthUser['role']): void {
    currentUser.set({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'usuario@fen.br',
      role,
    });
  }
});
