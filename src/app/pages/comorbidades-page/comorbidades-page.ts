import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapPencil, bootstrapTrash } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { Comorbidity } from '../../domain/clinical-records';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
  paginateItems,
} from '../../domain/pagination';
import { TemporaryClinicalRecordsStore } from '../../domain/temporary-clinical-records-store';

@Component({
  selector: 'app-comorbidades-page',
  imports: [FormsModule, NgIcon, PaginationControls, RouterLink],
  providers: [
    provideIcons({
      bootstrapEye,
      bootstrapPencil,
      bootstrapTrash,
    }),
  ],
  templateUrl: './comorbidades-page.html',
})
export class ComorbidadesPage {
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly searchTerm = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal<PageSize>(10);
  protected readonly comorbidityPendingDeletion = signal<Comorbidity | null>(null);
  protected readonly comorbidities = computed(() => this.store.comorbidities());
  protected readonly filteredComorbidities = computed(() =>
    this.store.searchComorbidities(this.searchTerm()),
  );
  protected readonly pagination = computed(() =>
    buildPagination(this.filteredComorbidities().length, this.currentPage(), this.pageSize()),
  );
  protected readonly paginatedComorbidities = computed(() =>
    paginateItems(this.filteredComorbidities(), this.currentPage(), this.pageSize()),
  );

  constructor(protected readonly store: TemporaryClinicalRecordsStore) {}

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

  protected interactionCount(comorbidity: Comorbidity): number {
    return this.store.getInteractionMedications(comorbidity).length;
  }

  protected askToDelete(comorbidity: Comorbidity): void {
    this.comorbidityPendingDeletion.set(comorbidity);
  }

  protected cancelDeletion(): void {
    this.comorbidityPendingDeletion.set(null);
  }

  protected confirmDeletion(): void {
    const comorbidity = this.comorbidityPendingDeletion();

    if (!comorbidity) {
      return;
    }

    this.store.deleteComorbidity(comorbidity.id);
    this.comorbidityPendingDeletion.set(null);
    this.currentPage.set(this.pagination().currentPage);
  }
}
