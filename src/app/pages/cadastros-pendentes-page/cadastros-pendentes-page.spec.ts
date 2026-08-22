import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { vi } from 'vitest';
import { authGuard } from '../../auth/auth.guard';
import {
  AdminRegistrationService,
  PendingRegistrationSummary,
} from '../../auth/admin-registration.service';
import { routes } from '../../app.routes';
import { adminOnlyGuard } from '../../domain/admin-only.guard';
import { VisualizarCadastroPendentePage } from '../visualizar-cadastro-pendente-page/visualizar-cadastro-pendente-page';
import { CadastrosPendentesPage } from './cadastros-pendentes-page';

describe('CadastrosPendentesPage', () => {
  let fixture: ComponentFixture<CadastrosPendentesPage>;
  let pendingResult: Subject<PendingRegistrationSummary[]>;
  let findPendentes: ReturnType<typeof vi.fn>;

  const registrations: PendingRegistrationSummary[] = [
    {
      id: '00000000-0000-0000-0000-000000000301',
      nome: 'Bia Estagiária',
      email: 'bia@fen.br',
      cpf: '98765432100',
      role: 'ESTAGIARIO',
      solicitadoEm: '2026-08-21T10:30:00',
    },
    {
      id: '00000000-0000-0000-0000-000000000304',
      nome: 'Carlos Farmacêutico',
      email: 'carlos@fen.br',
      cpf: '12345678901',
      role: 'FARMACEUTICO',
      solicitadoEm: '2026-08-20T09:00:00',
    },
  ];

  beforeEach(async () => {
    pendingResult = new Subject<PendingRegistrationSummary[]>();
    findPendentes = vi.fn((): Observable<PendingRegistrationSummary[]> => pendingResult);

    await TestBed.configureTestingModule({
      imports: [CadastrosPendentesPage],
      providers: [
        provideRouter([]),
        {
          provide: AdminRegistrationService,
          useValue: { findPendentes },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastrosPendentesPage);
    fixture.detectChanges();
  });

  it('shows a loading state until the request completes', () => {
    expect(nativeElement().querySelector('[data-pending-registrations-loading]')).toBeTruthy();
    expect(nativeElement().querySelector('tbody')).toBeNull();
  });

  it('shows an empty state when no registration is pending', () => {
    resolveWith([]);

    expect(
      nativeElement().querySelector('[data-pending-registrations-empty]')?.textContent,
    ).toContain('Nenhum cadastro pendente');
  });

  it('shows safe feedback when pending registrations cannot be loaded', () => {
    pendingResult.error(new Error('backend internal detail'));
    fixture.detectChanges();

    const feedback = nativeElement().querySelector(
      '[data-pending-registrations-error]',
    )?.textContent;
    expect(feedback).toContain('Não foi possível carregar os cadastros pendentes');
    expect(feedback).not.toContain('backend internal detail');
  });

  it('renders pending registrations and links each row to its detail', () => {
    resolveWith(registrations);

    const table = nativeElement().querySelector('tbody');
    const detailLink = nativeElement().querySelector<HTMLAnchorElement>(
      `[data-pending-registration-id="${registrations[0].id}"]`,
    );

    expect(table?.textContent).toContain('Bia Estagiária');
    expect(table?.textContent).toContain('bia@fen.br');
    expect(table?.textContent).toContain('Estagiário');
    expect(table?.textContent).toContain('Carlos Farmacêutico');
    expect(table?.textContent).toContain('Farmacêutico');
    expect(detailLink?.getAttribute('href')).toBe(
      `/admin/cadastros-pendentes/${registrations[0].id}`,
    );
    expect(nativeElement().textContent).not.toContain('Senha');
  });

  it('registers ADMIN-only list and detail routes', () => {
    const listRoute = routes.find((route) => route.path === 'admin/cadastros-pendentes');
    const detailRoute = routes.find((route) => route.path === 'admin/cadastros-pendentes/:id');

    expect(listRoute?.component).toBe(CadastrosPendentesPage);
    expect(listRoute?.canActivate).toEqual([authGuard, adminOnlyGuard]);
    expect(detailRoute?.component).toBe(VisualizarCadastroPendentePage);
    expect(detailRoute?.canActivate).toEqual([authGuard, adminOnlyGuard]);
  });

  function resolveWith(result: PendingRegistrationSummary[]): void {
    pendingResult.next(result);
    pendingResult.complete();
    fixture.detectChanges();
  }

  function nativeElement(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
});
