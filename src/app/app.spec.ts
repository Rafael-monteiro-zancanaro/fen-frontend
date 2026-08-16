import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { TemporaryAccessControl } from './domain/temporary-access-control';
import { TemporaryPasswordRecoveryStore } from './domain/temporary-password-recovery-store';
import { TemporaryClinicalRecordsStore } from './domain/temporary-clinical-records-store';
import { TemporaryPharmacyEmployeeStore } from './domain/temporary-pharmacy-employee-store';
import { TemporaryPharmaceuticalServiceStore } from './domain/temporary-pharmaceutical-service-store';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
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

    expect(compiled.querySelector('[data-field-error="password-confirmation"]')?.textContent).toContain(
      'As senhas devem ser iguais',
    );

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
    expect(compiled.querySelector('main[data-page="cadastro"]')?.classList.contains('items-start')).toBe(
      true,
    );
    expect(compiled.querySelector('main[data-page="cadastro"]')?.classList.contains('items-center')).toBe(
      false,
    );
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
    expect(compiled.querySelector('label[for="fimVigencia"]')?.textContent).toContain(
      'Fim da vig',
    );
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
    expect(compiled.querySelector('[data-chart="atendimentos-mes"] canvas[baseChart]')).toBeTruthy();
    expect(compiled.querySelector('[data-chart="tipos-atendimento"] canvas[baseChart]')).toBeTruthy();
    expect(
      compiled.querySelector('[data-chart="status-atendimentos"] canvas[baseChart]'),
    ).toBeTruthy();
  });

  it('should block password recovery admin routes for non-admin roles', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const accessControl = TestBed.inject(TemporaryAccessControl);

    accessControl.setRole('FARMACEUTICO');

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
    const accessControl = TestBed.inject(TemporaryAccessControl);

    accessControl.setRole('ESTAGIARIO');

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
    const accessControl = TestBed.inject(TemporaryAccessControl);

    accessControl.setRole('ADMIN');

    await router.navigateByUrl('/admin/funcionarios');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const search = compiled.querySelector<HTMLInputElement>('#employeeSearch');

    expect(compiled.querySelector('header nav')?.textContent).toContain('Funcionários');
    expect(compiled.querySelector('main[data-page="admin-funcionarios"] h1')?.textContent).toContain(
      'Funcionários',
    );
    expect(compiled.querySelector('tbody')?.textContent).toContain('Marina Almeida');
    expect(compiled.querySelector('tbody')?.textContent).toContain('Responsável técnico');
    expect(compiled.textContent).not.toContain('12345678901');
    expect(compiled.querySelector('[data-employee-actions]')?.querySelectorAll('ng-icon').length).toBe(
      1,
    );
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
    const accessControl = TestBed.inject(TemporaryAccessControl);

    accessControl.setRole('ADMIN');

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
    const accessControl = TestBed.inject(TemporaryAccessControl);
    const employeeStore = TestBed.inject(TemporaryPharmacyEmployeeStore);
    const pharmacist = employeeStore
      .employees()
      .find((employee) => employee.role === 'FARMACEUTICO' && !employee.isTechnicalResponsible);

    if (!pharmacist || pharmacist.role === 'ESTAGIARIO') {
      throw new Error('Expected seeded pharmacist employee.');
    }

    accessControl.setRole('ADMIN');

    await router.navigateByUrl(`/admin/funcionarios/${pharmacist.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('main[data-page="visualizar-funcionario"] h1')?.textContent).toContain(
      pharmacist.name,
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).toContain(
      'CRF',
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).toContain(
      'Responsável técnico',
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).not.toContain(
      'Tipo do estágio',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-toggle-technical-responsible]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.alert-dialog-title')?.textContent).toContain(
      'Definir como responsável técnico',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-confirm-technical-responsible]')?.click();
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
    const accessControl = TestBed.inject(TemporaryAccessControl);
    const employeeStore = TestBed.inject(TemporaryPharmacyEmployeeStore);
    const intern = employeeStore.employees().find((employee) => employee.role === 'ESTAGIARIO');

    if (!intern || intern.role !== 'ESTAGIARIO') {
      throw new Error('Expected seeded intern employee.');
    }

    accessControl.setRole('ADMIN');

    await router.navigateByUrl(`/admin/funcionarios/${intern.id}`);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('main[data-page="visualizar-funcionario"] h1')?.textContent).toContain(
      intern.name,
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).toContain(
      'Tipo do estágio',
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).toContain(
      'Supervisor',
    );
    expect(compiled.querySelector('main[data-page="visualizar-funcionario"]')?.textContent).not.toContain(
      'CRF',
    );
    expect(compiled.querySelector('button[data-toggle-technical-responsible]')).toBeNull();
  });

  it('should let ADMIN list, inspect, approve and reject password recovery requests', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const accessControl = TestBed.inject(TemporaryAccessControl);
    const recoveryStore = TestBed.inject(TemporaryPasswordRecoveryStore);

    accessControl.setRole('ADMIN');
    const requestToApprove = recoveryStore.createRequest('aprovar@uem.br');
    const requestToReject = recoveryStore.createRequest('rejeitar@uem.br');

    await router.navigateByUrl('/admin/recuperacoes-senha');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Recuperações de senha');
    expect(compiled.querySelector('main[data-page="admin-recuperacoes-senha"] h1')?.textContent).toContain(
      'Solicitações de recuperação de senha',
    );
    expect(compiled.querySelector('tbody')?.textContent).toContain('aprovar@uem.br');
    expect(compiled.querySelector('tbody')?.textContent).toContain('PENDENTE');
    expect(compiled.textContent).not.toContain('__FORM_PASSWORD_VALUE__');
    expect(
      compiled.querySelector('[data-recovery-actions]')?.classList.contains('flex-nowrap'),
    ).toBe(true);
    expect(compiled.querySelector('[data-recovery-actions]')?.querySelectorAll('ng-icon').length).toBe(
      3,
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain(
      'Analisar',
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain(
      'Aprovar',
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain(
      'Rejeitar',
    );
    expect(compiled.querySelector('[data-recovery-actions]')?.textContent).not.toContain('Editar');

    await router.navigateByUrl(`/admin/recuperacoes-senha/${requestToApprove.id}`);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(compiled.querySelector('main[data-page="visualizar-recuperacao-senha"] h1')?.textContent).toContain(
      'aprovar@uem.br',
    );
    expect(compiled.querySelector('main[data-page="visualizar-recuperacao-senha"]')?.textContent).not.toContain(
      'Nova senha',
    );

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
    expect(compiled.querySelector('.alert-success')?.textContent).toContain(
      'Solicitação aprovada',
    );

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
    const accessControl = TestBed.inject(TemporaryAccessControl);
    const recoveryStore = TestBed.inject(TemporaryPasswordRecoveryStore);

    accessControl.setRole('ADMIN');

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
    expect(compiled.querySelector('[data-pagination-summary="attendances"]')?.textContent).toContain(
      'Exibindo 1-2 de 2',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-status-filter="EXPIRADO"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('tbody')?.textContent).toContain('João Pereira');
    expect(compiled.querySelector('tbody')?.textContent).not.toContain('Maria Souza');
    expect(
      compiled.querySelector('button[data-status-filter="EXPIRADO"]')?.getAttribute('aria-selected'),
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

    expect(compiled.querySelector('main[data-page="visualizar-atendimento"] h1')?.textContent).toContain(
      'Bruna Santos',
    );
    expect(compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent).toContain(
      'Aguardando retorno',
    );
    expect(compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent).toContain(
      'Inaloterapia',
    );
    expect(compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent).toContain(
      'Soro fisiológico',
    );
    expect(compiled.querySelector('main[data-page="visualizar-atendimento"]')?.textContent).toContain(
      'Retornar a cada 7 dias, 3 vezes',
    );
    expect(compiled.querySelector('form')).toBeNull();
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

    expect(compiled.querySelector('main[data-page="servicos-farmaceuticos"] h1')?.textContent).toContain(
      'Novo atendimento',
    );
    expect(compiled.querySelectorAll('[data-service-step]').length).toBe(6);
    expect(compiled.querySelector('#identificacao-usuario')).toBeTruthy();
    expect(compiled.querySelector('#cuidados-farmaceuticos')).toBeTruthy();
    expect(compiled.querySelector('#aplicacao-injetaveis')).toBeTruthy();
    expect(compiled.querySelector('#inaloterapia')).toBeTruthy();
    expect(compiled.querySelector('#servicos-acompanhamento')).toBeTruthy();
    expect(compiled.querySelector('#acompanhamento')).toBeTruthy();
    expect(compiled.querySelector('#revisao-assinatura')).toBeNull();
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
    setInput('#estadoUsuario', 'PR');

    compiled.querySelector<HTMLInputElement>('#enableInaloterapia')?.click();
    fixture.detectChanges();

    setInput('#medicamentoInaloterapia', 'Soro fisiológico');
    setInput('#loteInaloterapia', 'L1');
    setInput('#validadeInaloterapia', '2027-01-01');
    setInput('#posologiaInaloterapia', 'Nebulização');
    compiled.querySelector<HTMLButtonElement>('button[data-add-medication="inaloterapia"]')?.click();
    fixture.detectChanges();

    setInput('#medicamentoInaloterapia', 'Broncodilatador');
    setInput('#loteInaloterapia', 'L2');
    setInput('#validadeInaloterapia', '2027-02-02');
    setInput('#posologiaInaloterapia', 'Conforme prescrição');
    compiled.querySelector<HTMLButtonElement>('button[data-add-medication="inaloterapia"]')?.click();
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
    expect(attendance.followUp?.returnIntervalDays).toBe(7);
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

    expect(compiled.querySelector('main[data-page="visualizar-medicamento"] h1')?.textContent).toContain(
      'Dipirona',
    );
    expect(compiled.querySelector('main[data-page="visualizar-medicamento"]')?.textContent).toContain(
      'Concentração',
    );
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

    expect(compiled.querySelector('main[data-page="editar-medicamento"] h1')?.textContent).toContain(
      'Editar medicamento',
    );

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
    expect(compiled.querySelector('[data-pagination-summary="medications"]')?.textContent).toContain(
      'Exibindo 1-10 de 12',
    );

    compiled.querySelector<HTMLButtonElement>('button[data-next-page="medications"]')?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('[data-pagination-summary="medications"]')?.textContent).toContain(
      'Exibindo 11-12 de 12',
    );

    const search = compiled.querySelector<HTMLInputElement>('#medicationSearch');

    if (!search) {
      throw new Error('Medication search input was not rendered.');
    }

    search.value = 'Medicamento 12';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr').length).toBe(1);
    expect(compiled.querySelector('[data-pagination-summary="medications"]')?.textContent).toContain(
      'Exibindo 1-1 de 1',
    );
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
    const interactionSearch = compiled.querySelector<HTMLInputElement>('#interactionMedicationSearch');

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

    expect(compiled.querySelector('main[data-page="visualizar-comorbidade"] h1')?.textContent).toContain(
      'Diabetes mellitus',
    );
    expect(compiled.querySelector('main[data-page="visualizar-comorbidade"]')?.textContent).toContain(
      'Dipirona',
    );
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

    expect(compiled.querySelector('main[data-page="editar-comorbidade"] h1')?.textContent).toContain(
      'Editar comorbidade',
    );
    expect(compiled.querySelectorAll('[data-selected-interaction-id]').length).toBe(1);
    expect(compiled.querySelector('[data-selected-interaction-id]')?.textContent).toContain(
      'Dipirona',
    );

    const name = compiled.querySelector<HTMLInputElement>('#comorbidityName');
    const interactionSearch = compiled.querySelector<HTMLInputElement>('#interactionMedicationSearch');

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
    expect(compiled.querySelector('[data-pagination-summary="comorbidities"]')?.textContent).toContain(
      'Exibindo 1-12 de 12',
    );
  });
});
