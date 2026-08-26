import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { bootstrapEye, bootstrapPencil, bootstrapTrash } from '@ng-icons/bootstrap-icons';
import { PaginationControls } from '../../components/pagination-controls/pagination-controls';
import { ComorbiditySummary } from '../../domain/clinical-records';
import {
  PAGE_SIZE_OPTIONS,
  PageSize,
  buildPagination,
  normalizePageSize,
} from '../../domain/pagination';
import { ComorbidityService } from '../../domain/comorbidity.service';

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
  protected readonly comorbidityPendingDeletion = signal<ComorbiditySummary | null>(null);
  protected readonly comorbidities = signal<ComorbiditySummary[]>([]);
  protected readonly filteredComorbidities = computed(() => this.comorbidities());
  protected readonly totalElements = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly loading = signal(false);
  protected readonly loadError = signal(false);
  protected readonly pagination = computed(() =>
    ({ ...buildPagination(this.totalElements(), this.currentPage(), this.pageSize()), totalPages: this.totalPages() }),
  );
  protected readonly paginatedComorbidities = computed(() =>
    this.filteredComorbidities(),
  );

  constructor(private readonly service: ComorbidityService) { this.load(); }

  private load(): void {
    this.loading.set(true); this.loadError.set(false);
    this.service.list(this.searchTerm(), this.currentPage() - 1, this.pageSize()).subscribe({ next: (page) => {
      this.comorbidities.set(page.content);
      this.totalElements.set(page.totalElements);
      this.totalPages.set(Math.max(1, page.totalPages));
      this.loading.set(false);
    }, error: () => { this.comorbidities.set([]); this.loadError.set(true); this.loading.set(false); } });
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

  protected interactionCount(comorbidity: ComorbiditySummary): number {
    return comorbidity.interactionCount;
  }

  protected askToDelete(comorbidity: ComorbiditySummary): void {
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

    this.service.delete(comorbidity.id).subscribe({ next: () => {
      this.comorbidityPendingDeletion.set(null);
      this.load();
    }, error: () => this.loadError.set(true) });
  }
}
