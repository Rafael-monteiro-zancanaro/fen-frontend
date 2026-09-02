import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { DashboardService, DashboardSummary } from '../../domain/dashboard.service';
import { InicioPage } from './inicio-page';

describe('InicioPage', () => {
  it('exibe loading sem substituir os indicadores por zeros', () => {
    const summary = new Subject<DashboardSummary>();
    const fixture = createPage(summary, vi.fn(() => Promise.resolve(true)));

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelectorAll('[data-dashboard-loading]').length).toBe(4);
    expect(page.querySelector('[data-dashboard-card]')).toBeNull();
  });

  it('exibe os indicadores e navega com os filtros correspondentes', () => {
    const summary = new Subject<DashboardSummary>();
    const navigate = vi.fn(() => Promise.resolve(true));
    const fixture = createPage(summary, navigate);

    summary.next(response());
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const awaiting = page.querySelector<HTMLButtonElement>(
      '[data-dashboard-card="awaiting-return"]',
    );
    expect(awaiting?.textContent).toContain('Aguardando retorno');
    expect(awaiting?.textContent).toContain('2');
    expect(page.querySelectorAll('[data-dashboard-card]').length).toBe(4);
    expect(page.textContent).toContain('Cuidados farmacêuticos');
    expect(page.textContent).toContain('Expirado');

    awaiting?.click();
    expect(navigate).toHaveBeenCalledWith(['/atendimentos'], {
      queryParams: { status: 'AGUARDANDO_RETORNO' },
    });

    page
      .querySelector<HTMLButtonElement>('[data-dashboard-card="returns-today"]')
      ?.click();
    expect(navigate).toHaveBeenCalledWith(['/atendimentos'], {
      queryParams: { retornoHoje: 'true' },
    });

    page
      .querySelector<HTMLButtonElement>('[data-dashboard-card="total-attendances"]')
      ?.click();
    expect(navigate).toHaveBeenCalledWith(['/atendimentos'], { queryParams: {} });

    page
      .querySelector<HTMLButtonElement>('[data-dashboard-card="expired-attendances"]')
      ?.click();
    expect(navigate).toHaveBeenCalledWith(['/atendimentos'], {
      queryParams: { status: 'EXPIRADO' },
    });
  });

  it('mostra erro e permite tentar novamente', () => {
    const summary = new Subject<DashboardSummary>();
    const getSummary = vi.fn(() => summary.asObservable());
    const fixture = TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [
        { provide: DashboardService, useValue: { getSummary } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
      ],
    }).createComponent(InicioPage);
    fixture.detectChanges();

    summary.error(new Error('falha'));
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.alert-danger')?.textContent).toContain(
      'Não foi possível carregar o dashboard',
    );
    page.querySelector<HTMLButtonElement>('[data-dashboard-retry]')?.click();
    expect(getSummary).toHaveBeenCalledTimes(2);
  });
});

function createPage(summary: Subject<DashboardSummary>, navigate: ReturnType<typeof vi.fn>) {
  const fixture = TestBed.configureTestingModule({
    imports: [InicioPage],
    providers: [
      { provide: DashboardService, useValue: { getSummary: () => summary.asObservable() } },
      { provide: Router, useValue: { navigate } },
    ],
  }).createComponent(InicioPage);
  fixture.detectChanges();
  return fixture;
}

function response(): DashboardSummary {
  return {
    indicators: { awaitingReturn: 2, returnsToday: 1, totalAttendances: 8, expired: 3 },
    serviceTypes: [
      { type: 'cuidados-farmaceuticos', count: 4 },
      { type: 'aplicacao-injetaveis', count: 2 },
      { type: 'inaloterapia', count: 1 },
      { type: 'servicos-farmaceuticos', count: 0 },
    ],
    statuses: [
      { status: 'CONCLUIDO', count: 3 },
      { status: 'AGUARDANDO_RETORNO', count: 2 },
      { status: 'EXPIRADO', count: 3 },
    ],
  };
}
