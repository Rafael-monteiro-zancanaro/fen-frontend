import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapPencil, bootstrapTrash } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { Medication } from '../../domain/clinical-records';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import { MedicationService } from '../../domain/medication.service';

@Component({
  selector: 'app-medicamentos-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapEye,
      bootstrapPencil,
      bootstrapTrash,
    }),
  ],
  templateUrl: './medicamentos-page.html',
})
export class MedicamentosPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly medicationPendingDeletion = signal<Medication | null>(null);
  protected readonly medications = signal<Medication[]>([]);
  protected readonly filteredMedications = computed(() => this.medications());
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly pagination = computed(() =>
    ({ ...buildPagination(this.totalElements(), this.currentPage(), this.pageSize()), totalPages: this.totalPages() }),
  );
  protected readonly paginatedMedications = computed(() =>
    this.filteredMedications(),
  );

  constructor(private readonly service: MedicationService) { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.service.list(this.searchTerm(), this.currentPage() - 1, this.pageSize()).subscribe({ next: (page) => {
      this.medications.set(page.content); this.totalElements.set(page.totalElements);
      this.totalPages.set(Math.max(1, page.totalPages)); this.loading.set(false);
    }, error: () => {
      this.medications.set([]); this.loadError.set(true); this.loading.set(false);
    }});
  }

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.load();
  }

  protected updatePageSize(value: string | number): void {
    this.pageSize.set(normalizePageSize(Number(value)));
    this.currentPage.set(1);
    this.load();
  }

  protected goToPreviousPage(): void {
    this.currentPage.set(Math.max(1, this.pagination().currentPage - 1));
    this.load();
  }

  protected goToNextPage(): void {
    const pagination = this.pagination();
    this.currentPage.set(Math.min(pagination.totalPages, pagination.currentPage + 1));
    this.load();
  }

  protected askToDelete(medication: Medication): void {
    this.medicationPendingDeletion.set(medication);
  }

  protected cancelDeletion(): void {
    this.medicationPendingDeletion.set(null);
  }

  protected confirmDeletion(): void {
    const medication = this.medicationPendingDeletion();

    if (!medication) {
      return;
    }

    this.service.delete(medication.id).subscribe({ next: () => {
      this.medicationPendingDeletion.set(null);
      this.load();
    }, error: () => this.loadError.set(true) });
  }
}
