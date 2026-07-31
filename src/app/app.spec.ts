import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
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
    expect(compiled.querySelector('button[type="submit"]')?.getAttribute('routerLink')).toBe(
      '/inicio',
    );
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Entrar');
    expect(compiled.querySelector('label[for="nome"]')).toBeNull();
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
    expect(compiled.querySelector('header nav')?.textContent).toContain('Pacientes');
    expect(compiled.querySelector('header nav')?.textContent).toContain('Sair');
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

  it('should render the pharmaceutical services form as scrollable cards', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/atendimentos/novo');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header nav')?.textContent).toContain('Atendimentos');
    expect(compiled.querySelector('main[data-page="servicos-farmaceuticos"] h1')?.textContent).toContain(
      'Serviços farmacêuticos',
    );
    expect(compiled.querySelectorAll('[data-service-step]').length).toBe(6);
    expect(compiled.querySelector('#identificacao-usuario')).toBeTruthy();
    expect(compiled.querySelector('#cuidados-farmaceuticos')).toBeTruthy();
    expect(compiled.querySelector('#aplicacao-injetaveis')).toBeTruthy();
    expect(compiled.querySelector('#inaloterapia')).toBeTruthy();
    expect(compiled.querySelector('#servicos-acompanhamento')).toBeTruthy();
    expect(compiled.querySelector('#revisao-assinatura')).toBeTruthy();
    expect(compiled.querySelector('.card-footer button[data-scroll-target="cuidados-farmaceuticos"]')?.textContent).toContain(
      'Avançar',
    );
    expect(compiled.querySelector('.card-footer a[href^="#"]')).toBeNull();
    expect(
      compiled.querySelector('main[data-page="servicos-farmaceuticos"] a[href^="#"]'),
    ).toBeNull();
    expect(compiled.querySelector('label[for="nomeUsuario"]')?.textContent).toContain('Nome');
    expect(compiled.querySelector('label[for="glicemiaCapilar"]')?.textContent).toContain(
      'Glicemia',
    );
    expect(compiled.querySelector('label[for="medicamentoInjetavel"]')?.textContent).toContain(
      'Medicamento',
    );
    expect(compiled.querySelector('label[for="sinaisSintomas"]')?.textContent).toContain(
      'Sinais e sintomas',
    );
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain(
      'Salvar atendimento',
    );
  });
});
