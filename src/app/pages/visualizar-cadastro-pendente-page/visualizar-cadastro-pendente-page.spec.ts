import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
  RouterOutlet,
} from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { vi } from 'vitest';
import { environment } from '../../../environments/environment';
import {
  AdminRegistrationService,
  PendingRegistrationDetail,
} from '../../auth/admin-registration.service';
import { CadastrosPendentesPage } from '../cadastros-pendentes-page/cadastros-pendentes-page';
import { VisualizarCadastroPendentePage } from './visualizar-cadastro-pendente-page';

@Component({ imports: [RouterOutlet], template: '<router-outlet />' })
class RoutedTestHost {}

describe('VisualizarCadastroPendentePage', () => {
  let fixture: ComponentFixture<VisualizarCadastroPendentePage>;
  let detailResult: Subject<PendingRegistrationDetail>;
  let findPendente: ReturnType<typeof vi.fn>;
  let aprovar: ReturnType<typeof vi.fn>;
  let rejeitar: ReturnType<typeof vi.fn>;
  let approveResult: Subject<void>;
  let rejectResult: Subject<void>;

  const registrationId = '00000000-0000-0000-0000-000000000301';
  const intern: PendingRegistrationDetail = {
    id: registrationId,
    funcionarioId: '00000000-0000-0000-0000-000000000302',
    nome: 'Bia Estagiária',
    email: 'bia@fen.br',
    cpf: '98765432100',
    dataNascimento: '2002-02-03',
    role: 'ESTAGIARIO',
    situacao: 'PENDENTE',
    solicitadoEm: '2026-08-21T10:30:00',
    crf: null,
    responsavelTecnico: null,
    tipoEstagio: 'NAO_OBRIGATORIO',
    supervisor: {
      id: '00000000-0000-0000-0000-000000000303',
      nome: 'Ana Supervisora',
    },
    inicioVigencia: '2026-08-01',
    fimVigencia: '2026-12-15',
  };

  beforeEach(async () => {
    detailResult = new Subject<PendingRegistrationDetail>();
    approveResult = new Subject<void>();
    rejectResult = new Subject<void>();
    findPendente = vi.fn((): Observable<PendingRegistrationDetail> => detailResult);
    aprovar = vi.fn((): Observable<void> => approveResult);
    rejeitar = vi.fn((): Observable<void> => rejectResult);

    await TestBed.configureTestingModule({
      imports: [VisualizarCadastroPendentePage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: registrationId }) } },
        },
        {
          provide: AdminRegistrationService,
          useValue: { findPendente, aprovar, rejeitar },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizarCadastroPendentePage);
    fixture.detectChanges();
  });

  it('loads the registration id from the route and shows loading feedback', () => {
    expect(findPendente).toHaveBeenCalledWith(registrationId);
    expect(nativeElement().querySelector('[data-pending-registration-loading]')).toBeTruthy();
  });

  it('shows safe feedback when the pending registration cannot be loaded', () => {
    detailResult.error(new Error('backend internal detail'));
    fixture.detectChanges();

    const feedback = nativeElement().querySelector(
      '[data-pending-registration-error]',
    )?.textContent;
    expect(feedback).toContain('Não foi possível carregar o cadastro pendente');
    expect(feedback).not.toContain('backend internal detail');
  });

  it('shows intern fields and the supervisor without credential fields', () => {
    resolveDetail(intern);

    const page = nativeElement().querySelector('[data-page="visualizar-cadastro-pendente"]');
    expect(page?.textContent).toContain('Bia Estagiária');
    expect(page?.textContent).toContain('Estagiário');
    expect(page?.textContent).toContain('Situação');
    expect(page?.textContent).toContain('Pendente');
    expect(page?.textContent).toContain('Tipo do estágio');
    expect(page?.textContent).toContain('Não obrigatório');
    expect(page?.textContent).toContain('Supervisor');
    expect(page?.textContent).toContain('Ana Supervisora');
    expect(page?.textContent).toContain('Início da vigência');
    expect(page?.textContent).toContain('Fim da vigência');
    expect(page?.textContent).not.toContain('CRF');
    expect(page?.textContent).not.toContain('Responsável técnico');
    expect(page?.textContent).not.toContain('Senha');
  });

  it('shows pharmacist professional fields without intern-only fields', () => {
    resolveDetail({
      ...intern,
      nome: 'Carlos Farmacêutico',
      role: 'FARMACEUTICO',
      crf: 'PR-12345',
      responsavelTecnico: true,
      tipoEstagio: null,
      supervisor: null,
      inicioVigencia: null,
      fimVigencia: null,
    });

    const page = nativeElement().querySelector('[data-page="visualizar-cadastro-pendente"]');
    expect(page?.textContent).toContain('Farmacêutico');
    expect(page?.textContent).toContain('CRF');
    expect(page?.textContent).toContain('PR-12345');
    expect(page?.textContent).toContain('Responsável técnico');
    expect(page?.textContent).toContain('Sim');
    expect(page?.textContent).not.toContain('Tipo do estágio');
    expect(page?.textContent).not.toContain('Supervisor');
  });

  it('does not send DELETE until rejection is explicitly confirmed', () => {
    resolveDetail(intern);

    click('[data-reject-registration]');

    expect(nativeElement().querySelector('.alert-dialog-title')?.textContent).toContain(
      'Rejeitar cadastro',
    );
    expect(rejeitar).not.toHaveBeenCalled();

    click('[data-confirm-reject-registration]');

    expect(rejeitar).toHaveBeenCalledWith(registrationId);
  });

  it('does not approve until approval is explicitly confirmed', () => {
    resolveDetail(intern);

    click('[data-approve-registration]');

    expect(nativeElement().querySelector('.alert-dialog-title')?.textContent).toContain(
      'Aprovar cadastro',
    );
    expect(aprovar).not.toHaveBeenCalled();

    click('[data-confirm-approve-registration]');

    expect(aprovar).toHaveBeenCalledWith(registrationId);
  });

  it('names the rejection dialog, focuses its safe action and makes the background inert', async () => {
    resolveDetail(intern);
    const trigger = element<HTMLButtonElement>('[data-reject-registration]');
    trigger.focus();

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = element<HTMLElement>('[role="alertdialog"]');
    const cancel = element<HTMLButtonElement>('[data-cancel-registration-decision]');
    const background = element<HTMLElement>('[data-pending-registration-background]');
    const labelId = dialog.getAttribute('aria-labelledby');
    const descriptionId = dialog.getAttribute('aria-describedby');

    expect(labelId).toBe('pending-registration-dialog-title');
    expect(descriptionId).toBe('pending-registration-dialog-description');
    expect(nativeElement().querySelector(`#${labelId}`)?.textContent).toContain(
      'Rejeitar cadastro',
    );
    expect(nativeElement().querySelector(`#${descriptionId}`)?.textContent).toContain(
      'não poderá ser desfeita',
    );
    expect(document.activeElement).toBe(cancel);
    expect(background.hasAttribute('inert')).toBe(true);
  });

  it('contains Tab and Shift+Tab focus inside the rejection dialog', async () => {
    await openRejectionDialog();
    const dialog = element<HTMLElement>('[role="alertdialog"]');
    const cancel = element<HTMLButtonElement>('[data-cancel-registration-decision]');
    const confirm = element<HTMLButtonElement>('[data-confirm-reject-registration]');

    cancel.dispatchEvent(keydown('Tab', true));
    expect(document.activeElement).toBe(confirm);

    confirm.dispatchEvent(keydown('Tab'));
    expect(document.activeElement).toBe(cancel);

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape, removes inert and restores focus to the rejection trigger', async () => {
    resolveDetail(intern);
    const trigger = element<HTMLButtonElement>('[data-reject-registration]');
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    element<HTMLElement>('[role="alertdialog"]').dispatchEvent(keydown('Escape'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(nativeElement().querySelector('[role="alertdialog"]')).toBeNull();
    expect(
      element<HTMLElement>('[data-pending-registration-background]').hasAttribute('inert'),
    ).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the detail open and shows feedback when a decision fails', () => {
    approveResult = new Subject<void>();
    aprovar.mockReturnValue(approveResult);
    resolveDetail(intern);

    click('[data-approve-registration]');
    click('[data-confirm-approve-registration]');
    approveResult.error(new Error('backend internal detail'));
    fixture.detectChanges();

    const feedback = nativeElement().querySelector(
      '[data-pending-registration-action-error]',
    )?.textContent;
    expect(feedback).toContain('Não foi possível aprovar o cadastro');
    expect(feedback).not.toContain('backend internal detail');
    expect(
      nativeElement().querySelector('[data-page="visualizar-cadastro-pendente"]'),
    ).toBeTruthy();
  });

  function resolveDetail(detail: PendingRegistrationDetail): void {
    detailResult.next(detail);
    detailResult.complete();
    fixture.detectChanges();
  }

  function click(selector: string): void {
    const button = element<HTMLButtonElement>(selector);
    button.click();
    fixture.detectChanges();
  }

  async function openRejectionDialog(): Promise<void> {
    resolveDetail(intern);
    const trigger = element<HTMLButtonElement>('[data-reject-registration]');
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function keydown(key: string, shiftKey = false): KeyboardEvent {
    return new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
  }

  function element<T extends Element>(selector: string): T {
    const result = nativeElement().querySelector<T>(selector);
    if (!result) {
      throw new Error(`Expected element ${selector}.`);
    }
    return result;
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});

describe('pending registration approval routing', () => {
  let fixture: ComponentFixture<RoutedTestHost>;
  let http: HttpTestingController;
  let router: Router;

  const registrationId = '00000000-0000-0000-0000-000000000301';
  const detail: PendingRegistrationDetail = {
    id: registrationId,
    funcionarioId: '00000000-0000-0000-0000-000000000302',
    nome: 'Bia Estagiária',
    email: 'bia@fen.br',
    cpf: '98765432100',
    dataNascimento: '2002-02-03',
    role: 'ESTAGIARIO',
    situacao: 'PENDENTE',
    solicitadoEm: '2026-08-21T10:30:00',
    crf: null,
    responsavelTecnico: null,
    tipoEstagio: 'NAO_OBRIGATORIO',
    supervisor: {
      id: '00000000-0000-0000-0000-000000000303',
      nome: 'Ana Supervisora',
    },
    inicioVigencia: '2026-08-01',
    fimVigencia: '2026-12-15',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutedTestHost],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: 'admin/cadastros-pendentes',
            component: CadastrosPendentesPage,
          },
          {
            path: 'admin/cadastros-pendentes/:id',
            component: VisualizarCadastroPendentePage,
          },
        ]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(RoutedTestHost);
  });

  afterEach(() => http.verify());

  it('instantiates the real list and reloads pending registrations after approval', async () => {
    await router.navigateByUrl(`/admin/cadastros-pendentes/${registrationId}`);
    fixture.detectChanges();

    http.expectOne(`${environment.apiUrl}/api/admin/usuarios/${registrationId}`).flush(detail);
    fixture.detectChanges();

    element<HTMLButtonElement>('[data-approve-registration]').click();
    fixture.detectChanges();
    element<HTMLButtonElement>('[data-confirm-approve-registration]').click();

    http
      .expectOne(`${environment.apiUrl}/api/admin/usuarios/${registrationId}/aprovar`)
      .flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/admin/cadastros-pendentes');
    const refreshedListRequest = http.expectOne(
      `${environment.apiUrl}/api/admin/usuarios/pendentes`,
    );
    refreshedListRequest.flush([
      {
        id: '00000000-0000-0000-0000-000000000304',
        nome: 'Carlos Farmacêutico',
        email: 'carlos@fen.br',
        cpf: '12345678901',
        role: 'FARMACEUTICO',
        solicitadoEm: '2026-08-22T09:00:00',
      },
    ]);
    fixture.detectChanges();

    expect(nativeElement().querySelector('[data-page="cadastros-pendentes"]')).toBeTruthy();
    expect(nativeElement().querySelector('tbody')?.textContent).toContain('Carlos Farmacêutico');
    expect(nativeElement().textContent).not.toContain('Bia Estagiária');
  });

  function element<T extends Element>(selector: string): T {
    const result = nativeElement().querySelector<T>(selector);
    if (!result) {
      throw new Error(`Expected element ${selector}.`);
    }
    return result;
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
