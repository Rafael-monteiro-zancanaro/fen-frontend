import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { vi } from 'vitest';
import {
  AdminRegistrationService,
  PendingRegistrationDetail,
} from '../../auth/admin-registration.service';
import { VisualizarCadastroPendentePage } from './visualizar-cadastro-pendente-page';

@Component({ template: '' })
class EmptyListPage {}

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
        provideRouter([{ path: 'admin/cadastros-pendentes', component: EmptyListPage }]),
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

  it('requires explicit approval confirmation and returns to the refreshed list after success', async () => {
    resolveDetail(intern);

    click('[data-approve-registration]');

    expect(nativeElement().querySelector('.alert-dialog-title')?.textContent).toContain(
      'Aprovar cadastro',
    );
    expect(aprovar).not.toHaveBeenCalled();

    click('[data-confirm-approve-registration]');

    expect(aprovar).toHaveBeenCalledWith(registrationId);
    expect(TestBed.inject(Router).url).not.toBe('/admin/cadastros-pendentes');

    approveResult.next();
    approveResult.complete();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/admin/cadastros-pendentes');
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
    const button = nativeElement().querySelector<HTMLButtonElement>(selector);
    if (!button) {
      throw new Error(`Expected button ${selector}.`);
    }
    button.click();
    fixture.detectChanges();
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
