import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  bootstrapCheckLg,
  bootstrapEye,
  bootstrapPencil,
  bootstrapPrinter,
} from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { AtendimentoPdfService } from '../../domain/atendimento-pdf.service';
import {
  ATTENDANCE_STATUS_LABELS,
  PHARMACEUTICAL_SERVICE_LABELS,
} from '../../domain/attendance-labels';
import {
  AttendanceStatus,
  AttendanceStatusFilter,
  PharmaceuticalServiceKey,
} from '../../domain/clinical-records';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import {
  ServicoFarmaceuticoService,
  ServicoFarmaceuticoSummary,
} from '../../domain/servico-farmaceutico.service';

@Component({
  selector: 'app-atendimentos-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapCheckLg,
      bootstrapEye,
      bootstrapPencil,
      bootstrapPrinter,
    }),
  ],
  templateUrl: './atendimentos-page.html',
})
export class AtendimentosPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<AttendanceStatusFilter>('TODOS');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly totalElements = signal(0);
  protected readonly attendancePendingCloseId = signal<string | null>(null);
  protected readonly isClosingAttendance = signal(false);
  protected readonly printingAttendanceId = signal<string | null>(null);
  protected readonly attendances = signal<ServicoFarmaceuticoSummary[]>([]);
  protected readonly pagination = computed(() =>
    buildPagination(this.totalElements(), this.currentPage(), this.pageSize()),
  );
  protected readonly hasActiveCriteria = computed(
    () => this.statusFilter() !== 'TODOS' || Boolean(this.searchTerm().trim()),
  );
  protected readonly isSystemEmpty = computed(
    () => this.totalElements() === 0 && !this.hasActiveCriteria(),
  );
  protected readonly statusFilters: { value: AttendanceStatusFilter; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'AGUARDANDO_RETORNO', label: 'Aguardando retorno' },
    { value: 'CONCLUIDO', label: 'Concluídos' },
    { value: 'EXPIRADO', label: 'Expirados' },
  ];

  constructor(
    private readonly servicoFarmaceuticoService: ServicoFarmaceuticoService,
    private readonly atendimentoPdfService: AtendimentoPdfService,
  ) {
    this.loadAttendances();
  }

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  protected updateStatusFilter(filter: AttendanceStatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
    this.loadAttendances();
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
    this.loadAttendances();
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
      this.loadAttendances();
    }
  }

  protected goToNextPage(): void {
    if (this.currentPage() < this.pagination().totalPages) {
      this.currentPage.update((page) => page + 1);
      this.loadAttendances();
    }
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
      new Date(this.localDateTime(value)),
    );
  }

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }

  protected statusBadgeClass(status: AttendanceStatus): string {
    if (status === 'CONCLUIDO') {
      return 'badge badge-success';
    }

    if (status === 'EXPIRADO') {
      return 'badge badge-warning';
    }

    return 'badge badge-secondary';
  }

  protected serviceLabels(attendance: ServicoFarmaceuticoSummary): string {
    return attendance.selectedServices
      .map((service) => PHARMACEUTICAL_SERVICE_LABELS[service as PharmaceuticalServiceKey])
      .filter(Boolean)
      .join(', ');
  }

  protected canContinueAttendance(attendance: ServicoFarmaceuticoSummary): boolean {
    return attendance.canContinue;
  }

  protected continueAttendanceLabel(attendance: ServicoFarmaceuticoSummary): string {
    if (!attendance.nextReturnNumber) {
      return 'Prosseguir atendimento';
    }

    return `Prosseguir atendimento (${attendance.nextReturnNumber} de ${attendance.returnCount})`;
  }

  protected askToCloseAttendance(id: string): void {
    this.successMessage.set('');
    this.attendancePendingCloseId.set(id);
  }

  protected cancelCloseAttendance(): void {
    this.attendancePendingCloseId.set(null);
  }

  protected confirmCloseAttendance(): void {
    const id = this.attendancePendingCloseId();
    if (!id || this.isClosingAttendance()) {
      return;
    }

    this.errorMessage.set('');
    this.isClosingAttendance.set(true);
    this.servicoFarmaceuticoService.close(id).subscribe({
      next: () => {
        this.successMessage.set('Atendimento encerrado com sucesso.');
        this.attendancePendingCloseId.set(null);
        this.isClosingAttendance.set(false);
        this.loadAttendances();
      },
      error: () => {
        this.errorMessage.set('Não foi possível encerrar o atendimento. Tente novamente.');
        this.attendancePendingCloseId.set(null);
        this.isClosingAttendance.set(false);
      },
    });
  }

  protected async printAttendance(id: string): Promise<void> {
    if (this.printingAttendanceId()) {
      return;
    }

    this.successMessage.set('');
    this.errorMessage.set('');
    this.printingAttendanceId.set(id);

    this.servicoFarmaceuticoService.get(id).subscribe({
      next: async (attendance) => {
        try {
          await this.atendimentoPdfService.generate(attendance);
        } catch {
          this.errorMessage.set('Não foi possível gerar a via do paciente. Tente novamente.');
        } finally {
          this.printingAttendanceId.set(null);
        }
      },
      error: () => {
        this.errorMessage.set('Atendimento não encontrado para impressão.');
        this.printingAttendanceId.set(null);
      },
    });
  }

  private loadAttendances(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.servicoFarmaceuticoService
      .list(this.searchTerm(), this.statusFilter(), this.currentPage() - 1, this.pageSize())
      .subscribe({
        next: (page) => {
          this.attendances.set(page.content);
          this.totalElements.set(page.totalElements);
          this.isLoading.set(false);
        },
        error: () => {
          this.attendances.set([]);
          this.totalElements.set(0);
          this.errorMessage.set('Não foi possível carregar os atendimentos. Tente novamente.');
          this.isLoading.set(false);
        },
      });
  }

  private localDateTime(value: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  }
}
