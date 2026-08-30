import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapSearch, bootstrapXCircle } from '@ng-icons/bootstrap-icons';
import { MedicationAutocomplete } from '../../components/medication-autocomplete/medication-autocomplete';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { ATTENDANCE_STATUS_LABELS } from '../../domain/attendance-labels';
import { AttendanceStatus, Medication, ServiceMedicationItem } from '../../domain/clinical-records';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import {
  ServicoFarmaceuticoAdvancedResult,
  ServicoFarmaceuticoService,
} from '../../domain/servico-farmaceutico.service';
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
  protected readonly results = signal<ServicoFarmaceuticoAdvancedResult[]>([]);
  protected readonly totalElements = signal(0);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly pagination = computed(() =>
    buildPagination(this.totalElements(), this.currentPage(), this.pageSize()),
  );

  constructor(private readonly servicoFarmaceuticoService: ServicoFarmaceuticoService) {}

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
    if (!this.hasAnyCriteria()) {
      this.hasSearched.set(false);
      this.results.set([]);
      this.totalElements.set(0);
      this.warningMessage.set('Informe ao menos um critério para realizar a busca.');
      return;
    }

    this.currentPage.set(1);
    this.loadResults();
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
    this.totalElements.set(0);
    this.hasSearched.set(false);
    this.currentPage.set(1);
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
    if (this.hasSearched()) {
      this.loadResults();
    }
  }

  protected goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
      this.loadResults();
    }
  }

  protected goToNextPage(): void {
    if (this.currentPage() < this.pagination().totalPages) {
      this.currentPage.update((page) => page + 1);
      this.loadResults();
    }
  }

  protected formatCpf(cpf: string): string {
    return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  protected formatDate(value: string): string {
    const dateTime = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(dateTime));
  }

  protected statusLabel(status: AttendanceStatus): string {
    return ATTENDANCE_STATUS_LABELS[status];
  }

  protected statusBadgeClass(status: AttendanceStatus): string {
    if (status === 'CONCLUIDO') {
      return 'badge badge-success';
    }
    return status === 'EXPIRADO' ? 'badge badge-warning' : 'badge badge-secondary';
  }

  protected totalLabel(): string {
    const total = this.totalElements();
    return total === 1 ? '1 atendimento encontrado' : `${total} atendimentos encontrados`;
  }

  protected matchedMedicationLabel(result: ServicoFarmaceuticoAdvancedResult): string {
    return result.matchedMedications[0]?.medicationConcentration ?? 'Não filtrado';
  }

  protected matchedBatchLabel(result: ServicoFarmaceuticoAdvancedResult): string {
    return result.matchedMedications[0]?.batch ?? '-';
  }

  private loadResults(): void {
    this.isLoading.set(true);
    this.warningMessage.set('');
    this.errorMessage.set('');
    this.servicoFarmaceuticoService
      .advancedSearch(
        onlyDigits(this.cpf()),
        this.medicationId(),
        this.batch(),
        this.attendanceDate(),
        this.currentPage() - 1,
        this.pageSize(),
      )
      .subscribe({
        next: (page) => {
          this.results.set(page.content);
          this.totalElements.set(page.totalElements);
          this.hasSearched.set(true);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Não foi possível realizar a busca. Tente novamente.');
          this.isLoading.set(false);
        },
      });
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
