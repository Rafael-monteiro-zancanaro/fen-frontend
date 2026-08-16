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
  paginateItems,
} from '../../domain/pagination';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

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
  protected readonly medications = computed(() => this.store.medications());
  protected readonly filteredMedications = computed(() =>
    this.store.searchMedications(this.searchTerm()),
  );
  protected readonly pagination = computed(() =>
    buildPagination(this.filteredMedications().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedMedications = computed(() =>
    paginateItems(this.filteredMedications(), this.currentPage(), this.pageSize()),
  );

  constructor(private readonly store: TemporaryClinicalRecordsStore) {}

  protected updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
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

    this.store.deleteMedication(medication.id);
    this.medicationPendingDeletion.set(null);
    this.currentPage.set(this.pagination().currentPage);
  }
}
