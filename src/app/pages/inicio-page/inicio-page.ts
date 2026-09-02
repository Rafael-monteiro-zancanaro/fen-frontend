import { Component, computed, signal } from '@angular/core';
import { Params, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapActivity,
  bootstrapCalendarCheck,
  bootstrapClock,
  bootstrapExclamationTriangle,
} from '@ng-icons/bootstrap-icons';
import { BaseChartDirective } from 'ng2-charts';
import {
  ATTENDANCE_STATUS_LABELS,
  PHARMACEUTICAL_SERVICE_LABELS,
} from '../../domain/attendance-labels';
import { AttendanceStatus, PharmaceuticalServiceKey } from '../../domain/clinical-records';
import { DashboardService, DashboardSummary } from '../../domain/dashboard.service';

interface DashboardCard {
  id: string;
  label: string;
  detail: string;
  value: number;
  icon: string;
  queryParams: Params;
}

@Component({
  selector: 'app-inicio-page',
  imports: [BaseChartDirective, NgIcon],
  providers: [
    provideIcons({
      bootstrapActivity,
      bootstrapCalendarCheck,
      bootstrapClock,
      bootstrapExclamationTriangle,
    }),
  ],
  templateUrl: './inicio-page.html',
})
export class InicioPage {
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly summaryCards = computed<DashboardCard[]>(() => {
    const indicators = this.summary()?.indicators;
    if (!indicators) return [];

    return [
      {
        id: 'awaiting-return',
        label: 'Aguardando retorno',
        detail: 'Atendimentos com reconsulta pendente',
        value: indicators.awaitingReturn,
        icon: 'bootstrapClock',
        queryParams: { status: 'AGUARDANDO_RETORNO' },
      },
      {
        id: 'returns-today',
        label: 'Reconsultas hoje',
        detail: 'Retornos previstos para a data atual',
        value: indicators.returnsToday,
        icon: 'bootstrapCalendarCheck',
        queryParams: { retornoHoje: 'true' },
      },
      {
        id: 'total-attendances',
        label: 'Atendimentos totais',
        detail: 'Histórico de serviços farmacêuticos',
        value: indicators.totalAttendances,
        icon: 'bootstrapActivity',
        queryParams: {},
      },
      {
        id: 'expired-attendances',
        label: 'Atendimentos expirados',
        detail: 'Reconsultas com prazo vencido',
        value: indicators.expired,
        icon: 'bootstrapExclamationTriangle',
        queryParams: { status: 'EXPIRADO' },
      },
    ];
  });

  protected readonly serviceTypesChartData = computed(() => {
    const types = this.summary()?.serviceTypes ?? [];
    return {
      labels: types.map((item) => this.serviceTypeLabel(item.type)),
      datasets: [
        {
          label: 'Atendimentos',
          data: types.map((item) => item.count),
          backgroundColor: ['#7f384a', '#aa5d75', '#42677d', '#3f7657'],
          borderRadius: 6,
        },
      ],
    };
  });

  protected readonly statusesChartData = computed(() => {
    const statuses = this.summary()?.statuses ?? [];
    return {
      labels: statuses.map((item) => ATTENDANCE_STATUS_LABELS[item.status]),
      datasets: [
        {
          label: 'Atendimentos',
          data: statuses.map((item) => item.count),
          backgroundColor: ['#3f7657', '#7f384a', '#9a6700'],
          borderRadius: 6,
        },
      ],
    };
  });

  protected readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number | null } }) =>
            `Quantidade: ${context.parsed.y ?? 0}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a' },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: '#71717a' },
        grid: { color: '#e4e4e7' },
      },
    },
  };

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
  ) {
    this.loadDashboard();
  }

  protected retry(): void {
    this.loadDashboard();
  }

  protected navigateToAttendances(queryParams: Params): void {
    void this.router.navigate(['/atendimentos'], { queryParams });
  }

  protected hasServiceTypeData(): boolean {
    return (this.summary()?.serviceTypes ?? []).some((item) => item.count > 0);
  }

  protected hasStatusData(): boolean {
    return (this.summary()?.statuses ?? []).some((item) => item.count > 0);
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: () => {
        this.summary.set(null);
        this.errorMessage.set('Não foi possível carregar o dashboard. Tente novamente.');
        this.isLoading.set(false);
      },
    });
  }

  protected serviceTypeLabel(type: PharmaceuticalServiceKey): string {
    return PHARMACEUTICAL_SERVICE_LABELS[type];
  }

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }
}
