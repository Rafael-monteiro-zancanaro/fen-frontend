import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapCheckLg, bootstrapEye } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { AttendanceStatus, AttendanceStatusFilter } from '../../domain/clinical-records';
import {
  ATTENDANCE_STATUS_LABELS,
  PHARMACEUTICAL_SERVICE_LABELS,
  TemporaryPharmaceuticalServiceStore,
} from '../../domain/temporary-pharmaceutical-service-store';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
  paginateItems,
} from '../../domain/pagination';

@Component({
  selector: 'app-atendimentos-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapCheckLg,
      bootstrapEye,
    }),
  ],
  templateUrl: './atendimentos-page.html',
})
export class AtendimentosPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly searchTerm = signal('');
  protected readonly statusFilter = signal<AttendanceStatusFilter>('TODOS');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly attendancePendingCloseId = signal<string | null>(null);
  protected readonly attendances = computed(() => this.store.attendances());
  protected readonly filteredAttendances = computed(() =>
    this.store.searchAttendances(this.searchTerm(), this.statusFilter()),
  );
  protected readonly pagination = computed(() =>
    buildPagination(this.filteredAttendances().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedAttendances = computed(() =>
    paginateItems(this.filteredAttendances(), this.currentPage(), this.pageSize()),
  );
  protected readonly statusFilters: { value: AttendanceStatusFilter; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'AGUARDANDO_RETORNO', label: 'Aguardando retorno' },
    { value: 'CONCLUIDO', label: 'Concluídos' },
    { value: 'EXPIRADO', label: 'Expirados' },
  ];

  constructor(private readonly store: TemporaryPharmaceuticalServiceStore) {}

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  protected updateStatusFilter(filter: AttendanceStatusFilter): void {
    this.statusFilter.set(filter);
    this.currentPage.set(1);
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
  }

  protected goToPreviousPage(): void {
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1));
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1));
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
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

  protected serviceLabels(attendance: { selectedServices: (keyof typeof PHARMACEUTICAL_SERVICE_LABELS)[] }): string {
    return attendance.selectedServices.map((service) => PHARMACEUTICAL_SERVICE_LABELS[service]).join(', ');
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

    if (!id) {
      return;
    }

    if (this.store.closeExpiredAttendance(id)) {
      this.successMessage.set('Atendimento encerrado com sucesso.');
    }

    this.attendancePendingCloseId.set(null);
    this.currentPage.set(this.pagination().currentPage);
  }
}
