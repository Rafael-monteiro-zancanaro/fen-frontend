import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapSearch, bootstrapXCircle } from '@ng-icons/bootstrap-icons';
import { MedicationAutocomplete } from '../../components/medication-autocomplete/medication-autocomplete';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import {
  AdvancedAttendanceSearchResult,
  AttendanceStatus,
  Medication,
  ServiceMedicationItem,
} from '../../domain/clinical-records';
import {
  ATTENDANCE_STATUS_LABELS,
  TemporaryPharmaceuticalServiceStore,
} from '../../domain/temporary-pharmaceutical-service-store';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
  paginateItems,
} from '../../domain/pagination';
import { maskCpf, onlyDigits } from '../../domain/text-masks';

@Component({
  selector: 'app-busca-avancada-atendimentos-page',
  imports: [FormsModule, MedicationAutocomplete, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapEye,
      bootstrapSearch,
      bootstrapXCircle,
    }),
  ],
  templateUrl: './busca-avancada-atendimentos-page.html',
})
export class BuscaAvancadaAtendimentosPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly cpf = signal('');
  protected readonly medicationQuery = signal('');
  protected readonly medicationId = signal('');
  protected readonly batch = signal('');
  protected readonly attendanceDate = signal('');
  protected readonly hasSearched = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly warningMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly results = signal<AdvancedAttendanceSearchResult[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly pagination = computed(() =>
    buildPagination(this.results().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedResults = computed(() =>
    paginateItems(this.results(), this.currentPage(), this.pageSize()),
  );

  constructor(private readonly store: TemporaryPharmaceuticalServiceStore) {}

  protected updateCpf(input: HTMLInputElement): void {
    const maskedCpf = maskCpf(input.value);

    this.cpf.set(maskedCpf);
    input.value = maskedCpf;
    this.currentPage.set(1);
  }

  protected updateMedicationQuery(value: string): void {
    this.medicationQuery.set(value);
    this.currentPage.set(1);

    if (!value.trim()) {
      this.medicationId.set('');
    }
  }

  protected selectMedication(medication: Medication): void {
    this.medicationId.set(medication.id);
    this.medicationQuery.set(this.formatMedication(medication));
  }

  protected updateBatch(value: string): void {
    this.batch.set(value);
    this.currentPage.set(1);
  }

  protected updateAttendanceDate(value: string): void {
    this.attendanceDate.set(value);
    this.currentPage.set(1);
  }

  protected submitSearch(): void {
    if (this.isLoading()) {
      return;
    }

    this.warningMessage.set('');
    this.errorMessage.set('');

    if (!this.hasAnyCriteria()) {
      this.hasSearched.set(false);
      this.results.set([]);
      this.currentPage.set(1);
      this.warningMessage.set('Informe ao menos um critério para realizar a busca.');
      return;
    }

    this.isLoading.set(true);

    try {
      this.results.set(
        this.store.searchAttendancesAdvanced({
          cpfPaciente: onlyDigits(this.cpf()),
          medicamentoId: this.medicationId(),
          lote: this.batch(),
          dataAtendimento: this.attendanceDate(),
        }),
      );
      this.hasSearched.set(true);
      this.currentPage.set(1);
    } catch {
      this.errorMessage.set('Não foi possível realizar a busca. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected clearFilters(): void {
    this.cpf.set('');
    this.medicationQuery.set('');
    this.medicationId.set('');
    this.batch.set('');
    this.attendanceDate.set('');
    this.warningMessage.set('');
    this.errorMessage.set('');
    this.results.set([]);
    this.hasSearched.set(false);
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

  protected totalLabel(): string {
    const total = this.results().length;

    return total === 1 ? '1 atendimento encontrado' : `${total} atendimentos encontrados`;
  }

  protected matchedMedicationLabel(result: AdvancedAttendanceSearchResult): string {
    const item = result.matchedMedications[0];

    if (!item) {
      return 'Não filtrado';
    }

    return item.medicationConcentration;
  }

  protected matchedBatchLabel(result: AdvancedAttendanceSearchResult): string {
    const item = result.matchedMedications[0];

    return item?.batch || '-';
  }

  private hasAnyCriteria(): boolean {
    return Boolean(
      onlyDigits(this.cpf()) || this.medicationId() || this.batch().trim() || this.attendanceDate(),
    );
  }

  private formatMedication(medication: Medication): string {
    return medication.measurementUnit
      ? `${medication.name} — ${medication.measurementUnit}`
      : medication.name;
  }
}
